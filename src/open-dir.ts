import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export type OpenDirResult = {
	errorMessage?: string;
};

export function normalizeOpenPath(fsPath: string): string {
	const normalized = path.normalize(fsPath).replace(/[/\\]+$/, '');
	try {
		return fs.realpathSync(normalized);
	} catch {
		return normalized;
	}
}

export type OpenDirOptions = {
	replace?: boolean;
};

function isFolderOpenInWorkspace(normalizedPath: string): boolean {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders) {
		return false;
	}
	return workspaceFolders.some((folder) => normalizeOpenPath(folder.uri.fsPath) === normalizedPath);
}

function resolveForceNewWindow(normalizedPath: string, replace?: boolean): boolean {
	if (replace === true) {
		return false;
	}
	if (isFolderOpenInWorkspace(normalizedPath)) {
		return false;
	}
	return true;
}

export async function openDirAtPath(
	fsPath: string,
	options?: OpenDirOptions,
): Promise<OpenDirResult> {
	const normalizedPath = normalizeOpenPath(fsPath);
	const resource = vscode.Uri.file(normalizedPath);
	const forceNewWindow = resolveForceNewWindow(normalizedPath, options?.replace);

	try {
		const stat = await vscode.workspace.fs.stat(resource);
		if ((stat.type & vscode.FileType.Directory) === 0) {
			return { errorMessage: 'Unable to open directory: not a directory' };
		}

		await vscode.commands.executeCommand('vscode.openFolder', resource, { forceNewWindow });
		return {};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { errorMessage: `Unable to open directory: ${message}` };
	}
}