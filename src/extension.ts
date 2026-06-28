import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as os from 'os';
import { execFile } from 'child_process';
import {
	describeITerm2ShortcutAction,
	getDefaultITerm2Action,
	getITerm2Action,
	ITERM2_ACTIONS,
	ITERM2_DEFAULT_ACTION_ID,
	ITERM2_SHORTCUT_ACTION_KEY,
	ITerm2Action,
	resolveITerm2ShortcutAction,
} from './iterm2-actions';
import { openInITerm2, OpenITerm2Deps } from './iterm2';

const GIT_REPOSITORY_PATHS_CONTEXT = 'openInNewWindow.gitRepositoryPaths';
const GIT_REPOSITORY_PATH_KEYS_CONTEXT = 'openInNewWindow.gitRepositoryPathKeys';
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
let extensionActivated = false;

export function isDevelopmentMode(extensionMode: vscode.ExtensionMode): boolean {
	return extensionMode === vscode.ExtensionMode.Development;
}

export async function activate(context: vscode.ExtensionContext) {
	if (extensionActivated) {
		debugLog('activate: already initialized, skipping duplicate activation');
		return;
	}
	extensionActivated = true;

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
			await openGitRepositoryAtPath(resource.fsPath, { silentNotDirectory: true });
		}),
		vscode.commands.registerCommand('open-in-new-window.debugGitPaths', async (resource?: vscode.Uri) => {
			await logGitPathDebugState(resource);
		}),
		vscode.commands.registerCommand('open-in-new-window.openITerm2', async () => {
			await runITerm2Action(context, getDefaultITerm2Action());
		}),
		vscode.commands.registerCommand('open-in-new-window.openITerm2Shortcut', async () => {
			await handleOpenITerm2Shortcut(context);
		}),
		vscode.commands.registerCommand('open-in-new-window.openITerm2Grok', async () => {
			const grokAction = getITerm2Action('grok');
			if (!grokAction) {
				return;
			}
			await runITerm2Action(context, grokAction);
		}),
		vscode.commands.registerCommand('open-in-new-window.switchITerm2Shortcut', async () => {
			const currentAction = getITerm2ShortcutAction(context);
			const picked = await pickITerm2Action(currentAction.id);
			if (!picked) {
				return;
			}
			await setITerm2ShortcutAction(context, picked.id);
			await vscode.window.showInformationMessage(describeITerm2ShortcutAction(picked));
		}),
		{ dispose: () => clearScheduledRescan() },
	);

	if (typeof vscode.window.registerUriHandler === 'function') {
		context.subscriptions.push(
			vscode.window.registerUriHandler({
				handleUri(uri: vscode.Uri) {
					void TestExported_handleGitOpenUri(uri.toString());
				},
			}),
		);
	}

	await initializeGitRepositoryContext(context);
}

type OpenGitRepositoryOptions = {
	silentNotDirectory?: boolean;
};

type OpenGitRepositoryResult = {
	errorMessage?: string;
};

async function openGitRepositoryAtPath(
	fsPath: string,
	options?: OpenGitRepositoryOptions,
): Promise<OpenGitRepositoryResult> {
	const normalizedPath = toGitRepositoryContextKey(fsPath);
	const resource = vscode.Uri.file(normalizedPath);

	try {
		const stat = await vscode.workspace.fs.stat(resource);
		if ((stat.type & vscode.FileType.Directory) === 0) {
			debugLog(`openGitRepositoryAtPath: skipped, not a directory (${normalizedPath})`);
			if (options?.silentNotDirectory) {
				return {};
			}
			const message = 'Unable to open git repository: not a directory';
			await vscode.window.showErrorMessage(message);
			return { errorMessage: message };
		}

		const hasGit = await isGitRepository(resource);
		debugLog(`openGitRepositoryAtPath: isGitRepository(${normalizedPath}) = ${hasGit}`);
		if (!hasGit) {
			return {};
		}

		await vscode.commands.executeCommand('git.openRepository', normalizedPath);
		debugLog(`openGitRepositoryAtPath: executed git.openRepository for ${normalizedPath}`);
		return {};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		debugLog(`openGitRepositoryAtPath: error for ${normalizedPath}: ${message}`);
		const fullMessage = `Unable to open git repository: ${message}`;
		await vscode.window.showErrorMessage(fullMessage);
		return { errorMessage: fullMessage };
	}
}

export async function TestExported_handleGitOpenUri(
	uriString: string,
	_state?: { errorMessage?: string },
): Promise<OpenGitRepositoryResult> {
	const uri = vscode.Uri.parse(uriString);
	if (uri.path !== '/git-open') {
		const message = `Invalid URI path for git-open handler: ${uri.path}`;
		await vscode.window.showErrorMessage(message);
		return { errorMessage: message };
	}

	const params = new URLSearchParams(uri.query);
	if (!params.has('path')) {
		const message = 'Missing path query parameter';
		await vscode.window.showErrorMessage(message);
		return { errorMessage: message };
	}

	const rawPath = params.get('path');
	if (rawPath === null || rawPath.trim() === '') {
		const message = 'Empty path query parameter';
		await vscode.window.showErrorMessage(message);
		return { errorMessage: message };
	}

	return openGitRepositoryAtPath(rawPath);
}

function debugLog(message: string): void {
	const line = `[${new Date().toISOString()}] ${message}`;
	console.log(`[open-in-new-window] ${message}`);
	debugOutputChannel?.appendLine(line);
}

function getITerm2ShortcutAction(context: vscode.ExtensionContext): ITerm2Action {
	const actionId = context.globalState.get<string>(ITERM2_SHORTCUT_ACTION_KEY, ITERM2_DEFAULT_ACTION_ID);
	return resolveITerm2ShortcutAction(actionId);
}

async function setITerm2ShortcutAction(
	context: vscode.ExtensionContext,
	actionId: string,
): Promise<void> {
	await context.globalState.update(ITERM2_SHORTCUT_ACTION_KEY, actionId);
}

function createITerm2Deps(
	context: vscode.ExtensionContext,
	action: ITerm2Action,
): OpenITerm2Deps {
	return {
		existsSync: fs.existsSync,
		execFile,
		homedir: os.homedir,
		showErrorMessage: async (message) => {
			await vscode.window.showErrorMessage(message);
		},
		getWorkspaceFolders: () => vscode.workspace.workspaceFolders,
		platform: process.platform,
		skipLaunch: context.extensionMode === vscode.ExtensionMode.Test,
		followUpCommands: action.followUpCommands,
	};
}

async function runITerm2Action(
	context: vscode.ExtensionContext,
	action: ITerm2Action,
): Promise<void> {
	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: action.label,
			cancellable: false,
		},
		async (progress) => {
			progress.report({ message: 'Launching iTerm2...' });
			await openInITerm2(createITerm2Deps(context, action));
		},
	);
}

async function pickITerm2Action(activeActionId?: string): Promise<ITerm2Action | undefined> {
	const picked = await vscode.window.showQuickPick(
		ITERM2_ACTIONS.map((action) => ({
			label: action.label,
			description: action.description,
			picked: action.id === activeActionId,
			action,
		})),
		{
			title: 'Switch Shortcut',
			placeHolder: 'Choose what Cmd+; should run',
		},
	);
	return picked?.action;
}

async function handleOpenITerm2Shortcut(context: vscode.ExtensionContext): Promise<void> {
	await runITerm2Action(context, getITerm2ShortcutAction(context));
}

async function initializeGitRepositoryContext(context: vscode.ExtensionContext): Promise<void> {
	gitRepositoryPathsCache = [];

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
		if (await isGitRepository(vscode.Uri.file(repoPath))) {
			debugLog(`handleWorkspacePathDeleted: .git still exists for ${repoPath}, keeping cached path`);
			return;
		}
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

	const discovered = await discoverGitRepositoryPaths();
	gitRepositoryPathsCache = mergeGitRepositoryPaths(discovered, gitRepositoryPathsCache);
	await publishGitRepositoryPathsContext();

	debugLog(
		`refreshGitRepositoryPathsContext: done (${reason}) in ${Date.now() - startedAt}ms, `
			+ `count=${gitRepositoryPathsCache.length}`,
	);
	for (const repoPath of gitRepositoryPathsCache) {
		debugLog(`  git repo: ${repoPath}`);
	}
}

export async function TestExported_refreshGitRepositoryPathsContext(reason: string): Promise<void> {
	return refreshGitRepositoryPathsContext(reason);
}

function mergeGitRepositoryPaths(...pathSets: string[][]): string[] {
	const merged: string[] = [];
	for (const paths of pathSets) {
		for (const entry of paths) {
			if (!merged.includes(entry)) {
				merged.push(entry);
			}
		}
	}
	return merged;
}

async function publishGitRepositoryPathsContext(): Promise<void> {
	const pathKeys = toGitRepositoryPathContextMap(gitRepositoryPathsCache);
	await vscode.commands.executeCommand('setContext', GIT_REPOSITORY_PATHS_CONTEXT, gitRepositoryPathsCache);
	await vscode.commands.executeCommand('setContext', GIT_REPOSITORY_PATH_KEYS_CONTEXT, pathKeys);
	debugLog(
		`publishGitRepositoryPathsContext: setContext(${GIT_REPOSITORY_PATHS_CONTEXT}, `
			+ `${gitRepositoryPathsCache.length} paths; `
			+ `${GIT_REPOSITORY_PATH_KEYS_CONTEXT}, ${Object.keys(pathKeys).length} keys)`,
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
	const normalized = path.normalize(fsPath).replace(/[/\\]+$/, '');
	try {
		return fs.realpathSync(normalized);
	} catch {
		return normalized;
	}
}

function collectGitRepositoryContextPathKeys(fsPath: string): string[] {
	const keys = new Set<string>();
	const normalized = path.normalize(fsPath).replace(/[/\\]+$/, '');

	const addKey = (value: string): void => {
		if (!value) {
			return;
		}
		keys.add(value);
		if (process.platform === 'darwin') {
			keys.add(value.toLowerCase());
		}
	};

	addKey(normalized);
	addKey(path.basename(normalized));
	try {
		addKey(fs.realpathSync(normalized));
	} catch {
		// Unit tests may pass non-existent fixture paths.
	}

	return [...keys];
}

export function toGitRepositoryPathContextMap(paths: readonly string[]): Record<string, boolean> {
	const map: Record<string, boolean> = {};
	for (const repoPath of paths) {
		for (const key of collectGitRepositoryContextPathKeys(repoPath)) {
			map[key] = true;
		}
	}
	return map;
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

async function addDiscoveredGitRepositoryPath(
	gitRepositoryPaths: string[],
	repoPath: string,
	depth: number,
): Promise<void> {
	const key = toGitRepositoryContextKey(repoPath);
	if (gitRepositoryPaths.includes(key)) {
		return;
	}

	gitRepositoryPaths.push(key);
	if (!gitRepositoryPathsCache.includes(key)) {
		gitRepositoryPathsCache.push(key);
		await publishGitRepositoryPathsContext();
	}
	debugLog(`scanForGitRepositories: found git repo at ${key} (depth=${depth})`);
}

async function scanForGitRepositories(
	directory: vscode.Uri,
	gitRepositoryPaths: string[],
): Promise<void> {
	const queue: Array<{ directory: vscode.Uri; depth: number }> = [{ directory, depth: 0 }];

	while (queue.length > 0) {
		const current = queue.shift();
		if (!current || current.depth > 12) {
			continue;
		}

		if (await isGitRepository(current.directory)) {
			await addDiscoveredGitRepositoryPath(
				gitRepositoryPaths,
				current.directory.fsPath,
				current.depth,
			);
		}

		let entries: [string, vscode.FileType][];
		try {
			entries = await vscode.workspace.fs.readDirectory(current.directory);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			debugLog(`scanForGitRepositories: readDirectory failed for ${current.directory.fsPath}: ${message}`);
			continue;
		}

		for (const [name, type] of entries) {
			if ((type & vscode.FileType.Directory) === 0 || SKIPPED_SCAN_DIRECTORIES.has(name)) {
				continue;
			}

			queue.push({
				directory: vscode.Uri.joinPath(current.directory, name),
				depth: current.depth + 1,
			});
		}
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
	const pathKeys = toGitRepositoryPathContextMap(gitRepositoryPathsCache);
	const resourcePathKeys = collectGitRepositoryContextPathKeys(resource.fsPath);
	const directMatch = gitRepositoryPathsCache.includes(normalizedResourcePath);
	const menuMatch = resourcePathKeys.some((key) => pathKeys[key]);
	const hasGit = await isGitRepository(resource);

	debugLog(`debugGitPaths: resource.fsPath=${resource.fsPath}`);
	debugLog(`debugGitPaths: normalized resourcePath=${normalizedResourcePath}`);
	debugLog(`debugGitPaths: resourcePath in cache = ${directMatch}`);
	debugLog(`debugGitPaths: resourcePath in pathKeys = ${menuMatch}`);
	debugLog(`debugGitPaths: isGitRepository = ${hasGit}`);
	debugLog(
		`debugGitPaths: menu when expects resourcePath in ${GIT_REPOSITORY_PATH_KEYS_CONTEXT}`,
	);
	for (const key of resourcePathKeys) {
		debugLog(`debugGitPaths: resource alias key=${key}, present=${pathKeys[key] === true}`);
	}

	vscode.window.showInformationMessage(
		`Git debug: menuMatch=${menuMatch}, cached=${directMatch}, isGit=${hasGit}, path=${normalizedResourcePath}`,
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
	extensionActivated = false;
}