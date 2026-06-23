import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const iterm2Path = path.resolve(import.meta.dirname, '../../../../out/iterm2.js');

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
	};
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
	default:
		throw new Error(`unknown scenario: ${request.scenario}`);
	}
}