import fs from 'node:fs';
import path from 'node:path';

export const FileType = {
	File: 1,
	Directory: 2,
	SymbolicLink: 64,
};

export function createVscodeMock(state) {
	return {
		FileType,
		ExtensionMode: { Development: 1, Production: 2, Test: 3 },
		Uri: {
			file: (fsPath) => ({ fsPath: path.resolve(fsPath), scheme: 'file' }),
			joinPath: (base, ...parts) => {
				const basePath = typeof base === 'string' ? base : base.fsPath;
				return { fsPath: path.join(basePath, ...parts), scheme: 'file' };
			},
		},
		workspace: {
			get workspaceFolders() {
				return state.workspaceFolders;
			},
			fs: {
				async stat(uri) {
					const target = uri.fsPath;
					if (!fs.existsSync(target)) {
						const error = new Error(`ENOENT: no such file or directory, stat '${target}'`);
						error.code = 'ENOENT';
						throw error;
					}
					const stat = fs.statSync(target);
					let type = FileType.File;
					if (stat.isDirectory()) {
						type = FileType.Directory;
					} else if (stat.isSymbolicLink()) {
						type = FileType.SymbolicLink;
					}
					return {
						type,
						size: stat.size,
						mtime: stat.mtimeMs,
						ctime: stat.ctimeMs,
					};
				},
				async readDirectory(uri) {
					const target = uri.fsPath;
					return fs.readdirSync(target, { withFileTypes: true }).map((entry) => [
						entry.name,
						entry.isDirectory() ? FileType.Directory : FileType.File,
					]);
				},
			},
			createFileSystemWatcher: () => ({
				onDidCreate: () => {},
				onDidDelete: () => {},
				dispose: () => {},
			}),
			onDidChangeWorkspaceFolders: () => ({ dispose: () => {} }),
		},
		commands: {
			registerCommand(_id, _handler) {
				return { dispose: () => {} };
			},
			async executeCommand(command, ...args) {
				if (command === 'setContext') {
					const [key, value] = args;
					state.context[key] = structuredClone(value);
					if (key === 'openInNewWindow.gitRepositoryPaths') {
						state.contextPublishHistory.push(structuredClone(value));
					}
				}
			},
		},
		window: {
			createOutputChannel: () => ({
				appendLine: () => {},
				show: () => {},
				dispose: () => {},
			}),
			showWarningMessage: async () => {},
			showErrorMessage: async () => {},
			showInformationMessage: async () => {},
		},
	};
}