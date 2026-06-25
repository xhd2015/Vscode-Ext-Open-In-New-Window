export function createVscodeMock(state) {
	return {
		ExtensionMode: { Development: 1, Production: 2, Test: 3 },
		ProgressLocation: { Notification: 15 },
		workspace: {
			get workspaceFolders() {
				return state.workspaceFolders ?? [];
			},
			createFileSystemWatcher: () => ({
				onDidCreate: () => {},
				onDidDelete: () => {},
				dispose: () => {},
			}),
			onDidChangeWorkspaceFolders: () => ({ dispose: () => {} }),
		},
		commands: {
			registerCommand(id, handler) {
				state.commandHandlers.set(id, handler);
				return { dispose: () => state.commandHandlers.delete(id) };
			},
			async executeCommand(command, ...args) {
				if (command === 'setContext') {
					const [key, value] = args;
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
			showErrorMessage: async (message) => {
				state.errorMessage = message;
			},
			showInformationMessage: async (message) => {
				state.informationMessage = message;
			},
			withProgress: async (_options, task) => {
				await task({ report: () => {} });
			},
			showQuickPick: async () => state.quickPickResult,
		},
	};
}

export function makeContext(state, { extensionMode = 3, shortcutActionId, omitShortcutActionId = false } = {}) {
	const globalStateStore = new Map();
	if (!omitShortcutActionId && shortcutActionId !== undefined) {
		globalStateStore.set('openInNewWindow.iTerm2ShortcutActionId', shortcutActionId);
	}
	const context = {
		subscriptions: [],
		extensionMode,
		globalState: {
			get(key, defaultValue) {
				return globalStateStore.has(key) ? globalStateStore.get(key) : defaultValue;
			},
			async update(key, value) {
				globalStateStore.set(key, value);
			},
		},
	};
	state.globalStateStore = globalStateStore;
	return context;
}

export function readStoredShortcutActionId(state) {
	return state.globalStateStore?.get('openInNewWindow.iTerm2ShortcutActionId');
}