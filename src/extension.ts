import * as path from 'path';
import * as vscode from 'vscode';

const GIT_REPOSITORY_PATHS_CONTEXT = 'openInNewWindow.gitRepositoryPaths';
const IS_DEVELOPMENT_CONTEXT = 'openInNewWindow.isDevelopment';
const DEBUG_OUTPUT_CHANNEL = 'Open In New Window';
const RESCAN_DEBOUNCE_MS = 5000;
const SKIPPED_SCAN_DIRECTORIES = new Set([
	'.git',
	'node_modules',
	'dist',
	'build',
	'out',
	'target',
	'vendor',
]);

let gitRepositoryPathsCache: string[] = [];
let debugOutputChannel: vscode.OutputChannel | undefined;
let rescanTimer: NodeJS.Timeout | undefined;

export function isDevelopmentMode(extensionMode: vscode.ExtensionMode): boolean {
	return extensionMode === vscode.ExtensionMode.Development;
}

export async function activate(context: vscode.ExtensionContext) {
	const isDevelopment = isDevelopmentMode(context.extensionMode);
	await vscode.commands.executeCommand('setContext', IS_DEVELOPMENT_CONTEXT, isDevelopment);

	debugOutputChannel = vscode.window.createOutputChannel(DEBUG_OUTPUT_CHANNEL);
	context.subscriptions.push(debugOutputChannel);

	debugLog(`activate: extension starting (mode=${vscode.ExtensionMode[context.extensionMode]})`);

	context.subscriptions.push(
		vscode.commands.registerCommand('open-in-new-window.open', async (resource?: vscode.Uri) => {
			if (!resource) {
				vscode.window.showWarningMessage('Select a file or folder in the explorer first.');
				return;
			}

			try {
				const folder = await getFolderToOpen(resource);
				await vscode.commands.executeCommand('vscode.openFolder', folder, { forceNewWindow: true });
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				vscode.window.showErrorMessage(`Unable to open in new window: ${message}`);
			}
		}),
		vscode.commands.registerCommand('open-in-new-window.gitOpenRepository', async (resource?: vscode.Uri) => {
			if (!resource) {
				debugLog('gitOpenRepository: no resource passed to command');
				return;
			}

			debugLog(`gitOpenRepository: invoked for ${resource.fsPath}`);

			try {
				const stat = await vscode.workspace.fs.stat(resource);
				if ((stat.type & vscode.FileType.Directory) === 0) {
					debugLog(`gitOpenRepository: skipped, not a directory (${resource.fsPath})`);
					return;
				}

				const hasGit = await isGitRepository(resource);
				debugLog(`gitOpenRepository: isGitRepository(${resource.fsPath}) = ${hasGit}`);
				if (!hasGit) {
					return;
				}

				await vscode.commands.executeCommand('git.openRepository', resource.fsPath);
				debugLog(`gitOpenRepository: executed git.openRepository for ${resource.fsPath}`);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				debugLog(`gitOpenRepository: error for ${resource.fsPath}: ${message}`);
				vscode.window.showErrorMessage(`Unable to open git repository: ${message}`);
			}
		}),
		vscode.commands.registerCommand('open-in-new-window.debugGitPaths', async (resource?: vscode.Uri) => {
			await logGitPathDebugState(resource);
		}),
		{ dispose: () => clearScheduledRescan() },
	);

	await initializeGitRepositoryContext(context);
}

function debugLog(message: string): void {
	const line = `[${new Date().toISOString()}] ${message}`;
	console.log(`[open-in-new-window] ${message}`);
	debugOutputChannel?.appendLine(line);
}

async function initializeGitRepositoryContext(context: vscode.ExtensionContext): Promise<void> {
	gitRepositoryPathsCache = [];
	await publishGitRepositoryPathsContext();
	debugLog('initializeGitRepositoryContext: published empty git path context');

	const workspaceWatcher = vscode.workspace.createFileSystemWatcher('**/*', false, false, false);
	workspaceWatcher.onDidCreate((uri) => {
		void handleWorkspacePathCreated(uri);
	});
	workspaceWatcher.onDidDelete((uri) => {
		void handleWorkspacePathDeleted(uri);
	});

	context.subscriptions.push(
		vscode.workspace.onDidChangeWorkspaceFolders(() => {
			debugLog('workspaceFolders changed');
			scheduleDebouncedRescan('workspaceFolders.changed');
		}),
		workspaceWatcher,
	);

	await refreshGitRepositoryPathsContext('initial-scan');
	debugLog('initializeGitRepositoryContext: initial scan complete');
}

export function getRepositoryPathForGitMetadata(fsPath: string): string {
	return toGitRepositoryContextKey(path.dirname(fsPath));
}

export async function handleWorkspacePathCreated(uri: vscode.Uri): Promise<void> {
	if (path.basename(uri.fsPath) === '.git') {
		const repoPath = getRepositoryPathForGitMetadata(uri.fsPath);
		debugLog(`handleWorkspacePathCreated: git metadata created at ${uri.fsPath} -> ${repoPath}`);
		await updateGitRepositoryPath(repoPath, true);
		scheduleDebouncedRescan('workspaceWatcher.git-create');
		return;
	}

	let stat: vscode.FileStat;
	try {
		stat = await vscode.workspace.fs.stat(uri);
	} catch {
		return;
	}

	if ((stat.type & vscode.FileType.Directory) === 0) {
		return;
	}

	if (!(await isGitRepository(uri))) {
		return;
	}

	debugLog(`handleWorkspacePathCreated: git repo directory appeared at ${uri.fsPath}`);
	await updateGitRepositoryPath(uri.fsPath, true);
	scheduleDebouncedRescan('workspaceWatcher.repo-dir-create');
}

export async function handleWorkspacePathDeleted(uri: vscode.Uri): Promise<void> {
	if (path.basename(uri.fsPath) === '.git') {
		const repoPath = getRepositoryPathForGitMetadata(uri.fsPath);
		debugLog(`handleWorkspacePathDeleted: git metadata deleted at ${uri.fsPath} -> ${repoPath}`);
		await updateGitRepositoryPath(repoPath, false);
		scheduleDebouncedRescan('workspaceWatcher.git-delete');
		return;
	}

	const repoPath = toGitRepositoryContextKey(uri.fsPath);
	if (!gitRepositoryPathsCache.includes(repoPath)) {
		return;
	}

	debugLog(`handleWorkspacePathDeleted: cached git repo removed at ${repoPath}`);
	await updateGitRepositoryPath(repoPath, false);
	scheduleDebouncedRescan('workspaceWatcher.repo-dir-delete');
}

function scheduleDebouncedRescan(reason: string): void {
	clearScheduledRescan();
	rescanTimer = setTimeout(() => {
		rescanTimer = undefined;
		void refreshGitRepositoryPathsContext(reason);
	}, RESCAN_DEBOUNCE_MS);
}

function clearScheduledRescan(): void {
	if (rescanTimer) {
		clearTimeout(rescanTimer);
		rescanTimer = undefined;
	}
}

async function refreshGitRepositoryPathsContext(reason: string): Promise<void> {
	const startedAt = Date.now();
	debugLog(`refreshGitRepositoryPathsContext: start (${reason})`);

	gitRepositoryPathsCache = await discoverGitRepositoryPaths();
	await publishGitRepositoryPathsContext();

	debugLog(
		`refreshGitRepositoryPathsContext: done (${reason}) in ${Date.now() - startedAt}ms, `
			+ `count=${gitRepositoryPathsCache.length}`,
	);
	for (const repoPath of gitRepositoryPathsCache) {
		debugLog(`  git repo: ${repoPath}`);
	}
}

async function publishGitRepositoryPathsContext(): Promise<void> {
	await vscode.commands.executeCommand('setContext', GIT_REPOSITORY_PATHS_CONTEXT, gitRepositoryPathsCache);
	debugLog(
		`publishGitRepositoryPathsContext: setContext(${GIT_REPOSITORY_PATHS_CONTEXT}, `
			+ `${gitRepositoryPathsCache.length} paths)`,
	);
}

async function updateGitRepositoryPath(repoPath: string, isGit: boolean): Promise<void> {
	const key = toGitRepositoryContextKey(repoPath);
	if (isGit) {
		if (!gitRepositoryPathsCache.includes(key)) {
			gitRepositoryPathsCache.push(key);
		}
	} else {
		gitRepositoryPathsCache = gitRepositoryPathsCache.filter((entry) => entry !== key);
	}

	await publishGitRepositoryPathsContext();
}

export function toGitRepositoryContextKey(fsPath: string): string {
	const normalized = path.normalize(fsPath);
	return normalized.replace(/[/\\]+$/, '');
}

export async function isGitRepository(resource: vscode.Uri): Promise<boolean> {
	try {
		await vscode.workspace.fs.stat(vscode.Uri.joinPath(resource, '.git'));
		return true;
	} catch {
		return false;
	}
}

export async function discoverGitRepositoryPaths(): Promise<string[]> {
	const gitRepositoryPaths: string[] = [];
	const workspaceFolders = vscode.workspace.workspaceFolders;

	debugLog(
		`discoverGitRepositoryPaths: workspaceFolders=${workspaceFolders?.map((folder) => folder.uri.fsPath).join(', ') ?? '(none)'}`,
	);

	if (!workspaceFolders) {
		return gitRepositoryPaths;
	}

	for (const folder of workspaceFolders) {
		await scanForGitRepositories(folder.uri, gitRepositoryPaths);
	}

	return gitRepositoryPaths;
}

async function scanForGitRepositories(
	directory: vscode.Uri,
	gitRepositoryPaths: string[],
	depth = 0,
): Promise<void> {
	if (depth > 12) {
		return;
	}

	if (await isGitRepository(directory)) {
		const key = toGitRepositoryContextKey(directory.fsPath);
		if (!gitRepositoryPaths.includes(key)) {
			gitRepositoryPaths.push(key);
			debugLog(`scanForGitRepositories: found git repo at ${key} (depth=${depth})`);
		}
	}

	let entries: [string, vscode.FileType][];
	try {
		entries = await vscode.workspace.fs.readDirectory(directory);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		debugLog(`scanForGitRepositories: readDirectory failed for ${directory.fsPath}: ${message}`);
		return;
	}

	for (const [name, type] of entries) {
		if ((type & vscode.FileType.Directory) === 0 || SKIPPED_SCAN_DIRECTORIES.has(name)) {
			continue;
		}

		await scanForGitRepositories(vscode.Uri.joinPath(directory, name), gitRepositoryPaths, depth + 1);
	}
}

async function logGitPathDebugState(resource?: vscode.Uri): Promise<void> {
	debugOutputChannel?.show(true);

	const workspaceFolders = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) ?? [];
	debugLog(`debugGitPaths: workspaceFolders=${workspaceFolders.join(', ') || '(none)'}`);
	debugLog(`debugGitPaths: cachedPaths=${gitRepositoryPathsCache.length}`);

	for (const repoPath of gitRepositoryPathsCache) {
		debugLog(`debugGitPaths: cached path: ${repoPath}`);
	}

	if (!resource) {
		vscode.window.showWarningMessage(
			'Open In New Window: run "Debug Git Paths" from a folder context menu to compare resourcePath.',
		);
		return;
	}

	const normalizedResourcePath = toGitRepositoryContextKey(resource.fsPath);
	const directMatch = gitRepositoryPathsCache.includes(normalizedResourcePath);
	const hasGit = await isGitRepository(resource);

	debugLog(`debugGitPaths: resource.fsPath=${resource.fsPath}`);
	debugLog(`debugGitPaths: normalized resourcePath=${normalizedResourcePath}`);
	debugLog(`debugGitPaths: resourcePath in cache = ${directMatch}`);
	debugLog(`debugGitPaths: isGitRepository = ${hasGit}`);
	debugLog(
		`debugGitPaths: menu when expects resourcePath in ${GIT_REPOSITORY_PATHS_CONTEXT}`,
	);

	vscode.window.showInformationMessage(
		`Git debug: cached=${directMatch}, isGit=${hasGit}, path=${normalizedResourcePath}`,
	);
}

async function getFolderToOpen(resource: vscode.Uri): Promise<vscode.Uri> {
	const stat = await vscode.workspace.fs.stat(resource);
	const isDirectory = (stat.type & vscode.FileType.Directory) !== 0;

	if (isDirectory) {
		return resource;
	}

	return vscode.Uri.file(path.dirname(resource.fsPath));
}

export function getPublishedGitRepositoryPaths(): readonly string[] {
	return gitRepositoryPathsCache;
}

export function deactivate() {
	clearScheduledRescan();
}