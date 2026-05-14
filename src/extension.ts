import * as path from 'path';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('open-in-new-window.open', async (resource?: vscode.Uri) => {
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
	});

	context.subscriptions.push(disposable);
}

async function getFolderToOpen(resource: vscode.Uri): Promise<vscode.Uri> {
	const stat = await vscode.workspace.fs.stat(resource);
	const isDirectory = (stat.type & vscode.FileType.Directory) !== 0;

	if (isDirectory) {
		return resource;
	}

	return vscode.Uri.file(path.dirname(resource.fsPath));
}

export function deactivate() {}
