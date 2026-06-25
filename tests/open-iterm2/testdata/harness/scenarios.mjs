import path from 'node:path';
import { createRequire } from 'node:module';
import { createVscodeMock, makeContext, readStoredShortcutActionId } from './vscode-mock.mjs';

const require = createRequire(import.meta.url);
const iterm2Path = path.resolve(import.meta.dirname, '../../../../out/iterm2.js');
const extensionPath = path.resolve(import.meta.dirname, '../../../../out/extension.js');
const VSCODE_STUB = '\0vscode-mock';
const SHORTCUT_ACTION_KEY = 'openInNewWindow.iTerm2ShortcutActionId';

const ITERM2_ACTIONS = {
	'cd-only': {
		id: 'cd-only',
		label: 'Open iTerm2',
		description: 'Open a new iTerm2 window and cd to the workspace',
		followUpCommands: [],
	},
	grok: {
		id: 'grok',
		label: 'Open iTerm2: Grok',
		description: 'cd to the workspace, then run grok',
		followUpCommands: ['grok'],
	},
};

function loadITerm2Module() {
	delete require.cache[iterm2Path];
	return require(iterm2Path);
}

function makeWorkspaceFolders(paths = []) {
	return paths.map((fsPath) => ({ uri: { fsPath } }));
}

function createDeps(request, state) {
	const iterm2 = loadITerm2Module();
	const existsSync = (targetPath) => {
		if (targetPath === iterm2.ITERM2_APP_PATH) {
			return request.existsITerm !== false;
		}
		return true;
	};

	const execFile = (file, args, callback) => {
		state.execFileCalled = true;
		state.execFileCommand = file;
		state.execFileArgv = args;
		if (request.execFileError) {
			callback(new Error(request.execFileError));
			return;
		}
		callback(null, '', '');
	};

	return {
		existsSync,
		execFile,
		homedir: () => request.homedir ?? '/Users/tester',
		showErrorMessage: async (message) => {
			state.errorMessage = message;
		},
		getWorkspaceFolders: () => makeWorkspaceFolders(request.workspaceFolders ?? []),
		platform: request.platform || 'darwin',
		skipLaunch: request.skipLaunch === true,
		followUpCommands: request.followUpCommands,
	};
}

function loadExtensionWithMock(state) {
	const mock = createVscodeMock(state);
	const Module = require('module');
	const originalResolve = Module._resolveFilename;
	Module._resolveFilename = function (requestName, parent, isMain, options) {
		if (requestName === 'vscode') {
			return VSCODE_STUB;
		}
		return originalResolve.call(this, requestName, parent, isMain, options);
	};
	require.cache[VSCODE_STUB] = { exports: mock };
	delete require.cache[extensionPath];
	const ext = require(extensionPath);
	Module._resolveFilename = originalResolve;
	return ext;
}

function installOpenITerm2Capture(state) {
	const iterm2 = loadITerm2Module();
	const originalOpenInITerm2 = iterm2.openInITerm2;
	require.cache[iterm2Path] = {
		exports: {
			...iterm2,
			async openInITerm2(deps) {
				state.followUpCommands = deps.followUpCommands ?? [];
				const result = await originalOpenInITerm2(deps);
				state.script = result.script;
				state.targetDir = result.targetDir;
				state.openResult = result;
				return result;
			},
		},
	};
}

function recordExecution(state, commandId) {
	state.executions.push({
		commandId,
		followUpCommands: [...(state.followUpCommands ?? [])],
		script: state.script ?? '',
		ok: state.openResult?.ok === true,
	});
}

async function executeCommand(state, commandId) {
	const handler = state.commandHandlers.get(commandId);
	if (!handler) {
		throw new Error(`command not registered: ${commandId}`);
	}
	await handler();
	recordExecution(state, commandId);
}

async function switchShortcut(state, actionId) {
	const action = ITERM2_ACTIONS[actionId];
	if (!action) {
		throw new Error(`unknown shortcut action id: ${actionId}`);
	}
	state.quickPickResult = {
		label: action.label,
		description: action.description,
		action,
	};
	const handler = state.commandHandlers.get('open-in-new-window.switchITerm2Shortcut');
	if (!handler) {
		throw new Error('command not registered: open-in-new-window.switchITerm2Shortcut');
	}
	await handler();
	state.executions.push({
		commandId: 'open-in-new-window.switchITerm2Shortcut',
		followUpCommands: [],
		script: '',
		ok: true,
	});
}

function buildWorkflowResponse(state) {
	const last = state.executions[state.executions.length - 1];
	return {
		followUpCommands: last?.followUpCommands ?? [],
		script: last?.script ?? '',
		targetDir: state.targetDir ?? '',
		ok: state.executions.every((entry) => entry.ok !== false),
		executions: state.executions,
		storedShortcutActionId: readStoredShortcutActionId(state),
		informationMessage: state.informationMessage ?? '',
	};
}

async function runExtensionWorkflow(request) {
	const state = {
		commandHandlers: new Map(),
		context: {},
		workspaceFolders: makeWorkspaceFolders(request.workspaceFolders ?? ['/tmp/proj']),
		executions: [],
	};
	installOpenITerm2Capture(state);
	const ext = loadExtensionWithMock(state);
	const context = makeContext(state, {
		extensionMode: 3,
		shortcutActionId: request.shortcutActionId,
		omitShortcutActionId: request.omitShortcutActionId === true,
	});
	try {
		await ext.activate(context);
		if (request.commandId) {
			await executeCommand(state, request.commandId);
		}
		for (const step of request.steps ?? []) {
			switch (step.type) {
			case 'switch-shortcut':
				await switchShortcut(state, step.actionId);
				break;
			case 'execute':
				await executeCommand(state, step.commandId);
				break;
			default:
				throw new Error(`unknown workflow step type: ${step.type}`);
			}
		}
	} finally {
		ext.deactivate();
	}
	return buildWorkflowResponse(state);
}

export async function runScenario(request) {
	const iterm2 = loadITerm2Module();
	const state = {
		execFileCalled: false,
		execFileArgs: [],
		errorMessage: undefined,
	};

	switch (request.scenario) {
	case 'path-workspace-first-folder':
	case 'path-no-workspace-uses-home':
	case 'path-multi-root-uses-first': {
		const homedir = request.homedir ?? '/Users/tester';
		const targetDir = iterm2.resolveTargetDirectory(
			makeWorkspaceFolders(request.workspaceFolders ?? []),
			homedir,
		);
		return { targetDir };
	}
	case 'escape-spaces':
	case 'escape-single-quote': {
		const script = iterm2.buildOpenITerm2Script(request.testPath ?? '');
		return {
			script,
			escapedPath: iterm2.escapePathForAppleScript(request.testPath ?? ''),
		};
	}
	case 'launch-builds-new-window-script': {
		const script = iterm2.buildOpenITerm2Script(request.testPath ?? '/tmp/proj');
		return {
			script,
			usesCreateWindow: script.includes('create window with default profile'),
			usesCreateTab: script.includes('create tab'),
		};
	}
	case 'launch-invokes-osascript':
	case 'error-iterm-not-installed':
	case 'error-osascript-failure': {
		const deps = createDeps(request, state);
		const result = await iterm2.openInITerm2(deps);
		return {
			...result,
			execFileCalled: state.execFileCalled,
			execFileCommand: state.execFileCommand,
			execFileArgv: state.execFileArgv,
			errorMessage: state.errorMessage,
		};
	}
	case 'extension-workflow':
		return runExtensionWorkflow(request);
	default:
		throw new Error(`unknown scenario: ${request.scenario}`);
	}
}