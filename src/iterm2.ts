import { execFile as nodeExecFile } from 'node:child_process';
import * as fs from 'node:fs';

export const ITERM2_APP_PATH = '/Applications/iTerm.app';

export function resolveTargetDirectory(
	workspaceFolders: readonly { uri: { fsPath: string } }[] | undefined,
	homedir: string,
): string {
	if (workspaceFolders && workspaceFolders.length > 0) {
		return workspaceFolders[0].uri.fsPath;
	}
	return homedir;
}

export function escapePathForAppleScript(dirPath: string): string {
	return dirPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function escapeCommandForAppleScript(command: string): string {
	return command.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function normalizeTargetDirectory(
	dirPath: string,
	options: {
		existsSync?: (path: string) => boolean;
		realpathSync?: (path: string) => string;
	} = {},
): string {
	const existsSync = options.existsSync ?? fs.existsSync;
	const realpathSync = options.realpathSync ?? ((path: string) => fs.realpathSync.native(path));
	try {
		if (existsSync(dirPath)) {
			return realpathSync(dirPath);
		}
	} catch {
		// Keep the original path when normalization fails.
	}
	return dirPath;
}

export function buildSessionCommandLines(
	followUpCommands: readonly string[] = [],
): string[] {
	return [
		'        write text ("cd " & quoted form of targetDir)',
		...followUpCommands.map(
			(command) => `        write text "${escapeCommandForAppleScript(command)}"`,
		),
	];
}

export function buildPathScanSmokeScript(): string {
	return [
		'tell application "iTerm2"',
		'  repeat with aWindow in windows',
		'    repeat with aTab in tabs of aWindow',
		'      repeat with aSession in sessions of aTab',
		'        try',
		'          tell aSession',
		'            set sessionPath to variable named "path"',
		'          end tell',
		'        on error',
		'        end try',
		'      end repeat',
		'    end repeat',
		'  end repeat',
		'  return "ok"',
		'end tell',
	].join('\n');
}

export function buildOpenITerm2Script(
	dirPath: string,
	followUpCommands: readonly string[] = [],
): string {
	const escaped = escapePathForAppleScript(dirPath);
	const sessionCommandLines = buildSessionCommandLines(followUpCommands);
	return [
		'tell application "iTerm2"',
		'  activate',
		`  set targetDir to "${escaped}"`,
		'  set matchingWindow to missing value',
		'  repeat with aWindow in windows',
		'    if not (is hotkey window of aWindow) then',
		'      repeat with aTab in tabs of aWindow',
		'        repeat with aSession in sessions of aTab',
		'          try',
		'            tell aSession',
		'              set sessionPath to variable named "path"',
		'            end tell',
		'            if sessionPath is targetDir then',
		'              set matchingWindow to aWindow',
		'              exit repeat',
		'            end if',
		'          on error',
		'          end try',
		'        end repeat',
		'        if matchingWindow is not missing value then exit repeat',
		'      end repeat',
		'      if matchingWindow is not missing value then exit repeat',
		'    end if',
		'  end repeat',
		'  if matchingWindow is not missing value then',
		'    tell matchingWindow',
		'      create tab with default profile',
		'      tell current session of current tab',
		...sessionCommandLines,
		'      end tell',
		'      select',
		'    end tell',
		'  else',
		'    set newWindow to (create window with default profile)',
		'    tell current session of newWindow',
		...sessionCommandLines,
		'    end tell',
		'  end if',
		'end tell',
	].join('\n');
}

export function isITerm2Installed(existsSync: (path: string) => boolean = fs.existsSync): boolean {
	return existsSync(ITERM2_APP_PATH);
}

export interface OpenITerm2Result {
	ok: boolean;
	error?: string;
	script?: string;
	targetDir?: string;
	skippedLaunch?: boolean;
}

export interface OpenITerm2Deps {
	existsSync: (path: string) => boolean;
	execFile: typeof nodeExecFile;
	homedir: () => string;
	showErrorMessage: (message: string) => void | PromiseLike<void>;
	getWorkspaceFolders: () => readonly { uri: { fsPath: string } }[] | undefined;
	platform: NodeJS.Platform;
	skipLaunch?: boolean;
	followUpCommands?: readonly string[];
}

function execFileAsync(
	execFile: typeof nodeExecFile,
	file: string,
	args: string[],
): Promise<void> {
	return new Promise((resolve, reject) => {
		execFile(file, args, (error) => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}

export async function openInITerm2(deps: OpenITerm2Deps): Promise<OpenITerm2Result> {
	if (deps.platform !== 'darwin') {
		await deps.showErrorMessage('Open iTerm2 is only supported on macOS.');
		return { ok: false, error: 'not-macos' };
	}

	if (!isITerm2Installed(deps.existsSync)) {
		await deps.showErrorMessage(
			'iTerm2 is not installed. Install it from https://iterm2.com/',
		);
		return { ok: false, error: 'iterm-not-installed' };
	}

	const targetDir = normalizeTargetDirectory(
		resolveTargetDirectory(deps.getWorkspaceFolders(), deps.homedir()),
	);
	const script = buildOpenITerm2Script(targetDir, deps.followUpCommands ?? []);

	if (deps.skipLaunch) {
		return { ok: true, script, targetDir, skippedLaunch: true };
	}

	try {
		await execFileAsync(deps.execFile, 'osascript', ['-e', script]);
		return { ok: true, script, targetDir };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		await deps.showErrorMessage(`Unable to open iTerm2: ${message}`);
		return { ok: false, error: message, script, targetDir };
	}
}

