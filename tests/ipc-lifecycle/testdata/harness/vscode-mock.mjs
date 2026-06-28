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
			parse(uriString) {
				const parsed = new URL(uriString);
				return {
					scheme: parsed.protocol.replace(':', ''),
					authority: parsed.host,
					path: parsed.pathname,
					query: parsed.search.replace(/^\?/, ''),
					fsPath: decodeURIComponent(parsed.pathname),
				};
			},
			file: (fsPath) => ({ fsPath: path.resolve(fsPath), scheme: 'file' }),
			joinPath: (base, ...parts) => {
				const basePath = typeof base === 'string' ? base : base.fsPath;
				return { fsPath: path.join(basePath, ...parts), scheme: 'file' };
			},
		},
		workspace: {
			get workspaceFolders() {
				return state.workspaceFolders ?? [];
			},
			fs: {
				async stat(uri) {
					const target = uri.fsPath ?? uri;
					if (!fs.existsSync(target)) {
						const error = new Error(`ENOENT: no such file or directory, stat '${target}'`);
						error.code = 'ENOENT';
						throw error;
					}
					const stat = fs.statSync(target);
					let type = FileType.File;
					if (stat.isDirectory()) {
						type = FileType.Directory;
					}
					return { type, size: stat.size, mtime: stat.mtimeMs, ctime: stat.ctimeMs };
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
					state.context = state.context ?? {};
					state.context[key] = structuredClone(value);
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