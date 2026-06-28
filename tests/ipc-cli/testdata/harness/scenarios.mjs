import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createVscodeMock } from './vscode-mock.mjs';
import { initGitRepo } from './fixtures.mjs';

const require = createRequire(import.meta.url);
const extensionPath = path.resolve(import.meta.dirname, '../../../../out/extension.js');
const VSCODE_STUB = '\0vscode-mock';
const EXTENSION_ID = 'xhd2015.open-in-new-window';
const IPC_VERSION = '0.0.1';

function loadExtension(state) {
	const mock = createVscodeMock(state);
	const Module = require('module');
	const originalResolve = Module._resolveFilename;
	Module._resolveFilename = function (request, parent, isMain, options) {
		if (request === 'vscode') {
			return VSCODE_STUB;
		}
		return originalResolve.call(this, request, parent, isMain, options);
	};
	require.cache[VSCODE_STUB] = { exports: mock };
	delete require.cache[extensionPath];
	const ext = require(extensionPath);
	Module._resolveFilename = originalResolve;
	return ext;
}

function makeContext(windowId = 'test-window') {
	return {
		subscriptions: [],
		extensionMode: 3,
		windowId,
	};
}

function normalizeKey(ext, fsPath) {
	return ext.toGitRepositoryContextKey(fsPath);
}

function buildOpenUri(dirPath, replace = false) {
	const encoded = encodeURIComponent(dirPath);
	let uri = `vscode://${EXTENSION_ID}/open?path=${encoded}`;
	if (replace) {
		uri += '&replace=true';
	}
	return uri;
}

async function withHarness(fn) {
	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ipc-cli-'));
	const koolDir = path.join(tempRoot, 'kool');
	fs.mkdirSync(koolDir, { recursive: true });
	let extension;
	try {
		return await fn(tempRoot, koolDir, (ext) => {
			extension = ext;
		});
	} finally {
		extension?.deactivate();
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
}

async function activateWithIpc(ext, state, koolDir, windowId) {
	if (typeof ext.TestExported_setKoolDirForTest === 'function') {
		ext.TestExported_setKoolDirForTest(koolDir);
	}
	if (typeof ext.TestExported_setWindowIdForTest === 'function') {
		ext.TestExported_setWindowIdForTest(windowId);
	}
	await ext.activate(makeContext(windowId));
	if (typeof ext.TestExported_waitForIpcReady === 'function') {
		await ext.TestExported_waitForIpcReady();
	}
}

async function sendIpcRequest(koolDir, request) {
	const socketPath = path.join(koolDir, 'xhd2015.open-in-new-window.sock');
	return new Promise((resolve, reject) => {
		const client = net.createConnection(socketPath);
		let data = '';
		client.on('data', (chunk) => {
			data += chunk.toString('utf8');
		});
		client.on('end', () => {
			const line = data.trim().split('\n').pop();
			try {
				resolve(JSON.parse(line));
			} catch (error) {
				reject(new Error(`invalid IPC response: ${data}`));
			}
		});
		client.on('error', reject);
		client.write(`${JSON.stringify(request)}\n`);
		client.end();
	});
}

async function invokeIpc(ext, koolDir, request) {
	if (typeof ext.TestExported_ipcHandleRequest === 'function') {
		const raw = await ext.TestExported_ipcHandleRequest(JSON.stringify(request));
		return JSON.parse(raw);
	}
	return sendIpcRequest(koolDir, request);
}

async function invokeOpenUri(ext, state, uriString) {
	if (typeof ext.TestExported_handleOpenUri !== 'function') {
		throw new Error('TestExported_handleOpenUri is not exported from extension');
	}
	return ext.TestExported_handleOpenUri(uriString, state);
}

function workspaceFolder(dirPath) {
	return {
		uri: { fsPath: path.resolve(dirPath) },
		name: path.basename(dirPath),
		index: 0,
	};
}

function mergeState(state, ipcResponse, extra = {}) {
	return {
		ok: ipcResponse?.ok ?? false,
		version: ipcResponse?.version ?? '',
		error: ipcResponse?.error ?? '',
		openFolderCalled: state.openFolderCalled ?? false,
		openFolderPath: state.openFolderPath ?? '',
		openFolderForceNewWindow: state.openFolderForceNewWindow ?? false,
		gitOpenCalled: state.gitOpenCalled ?? false,
		gitOpenPath: state.gitOpenPath ?? '',
		errorMessage: state.errorMessage ?? '',
		...extra,
	};
}

export async function runScenario(request) {
	switch (request.scenario) {
	case 'ipc-ping-success':
		return ipcPingSuccess();
	case 'ipc-open-valid-dir':
		return ipcOpenValidDir();
	case 'ipc-open-trailing-slash':
		return ipcOpenTrailingSlash();
	case 'ipc-open-focus-existing':
		return ipcOpenFocusExisting();
	case 'ipc-open-replace':
		return ipcOpenReplace();
	case 'ipc-open-not-directory':
		return ipcOpenNotDirectory();
	case 'ipc-open-missing-path':
		return ipcOpenMissingPath();
	case 'ipc-open-nonexistent-path':
		return ipcOpenNonexistentPath();
	case 'ipc-git-open-valid-repo':
		return ipcGitOpenValidRepo();
	case 'ipc-git-open-no-git':
		return ipcGitOpenNoGit();
	case 'ipc-git-open-not-directory':
		return ipcGitOpenNotDirectory();
	case 'ipc-unknown-op':
		return ipcUnknownOp();
	case 'uri-open-fallback':
		return uriOpenFallback();
	case 'uri-open-focus-existing':
		return uriOpenFocusExisting();
	case 'uri-open-replace-fallback':
		return uriOpenReplaceFallback();
	case 'uri-open-not-directory':
		return uriOpenNotDirectory();
	case 'uri-open-missing-path-query':
		return uriOpenMissingPathQuery();
	case 'uri-open-empty-path-query':
		return uriOpenEmptyPathQuery();
	default:
		throw new Error(`unknown scenario: ${request.scenario}`);
	}
}

async function ipcPingSuccess() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await activateWithIpc(ext, state, koolDir, 'win-ping');

		const ipcResponse = await invokeIpc(ext, koolDir, { op: 'ping' });
		return mergeState(state, ipcResponse);
	});
}

async function ipcOpenValidDir() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const dirPath = path.join(tempRoot, 'project');
		fs.mkdirSync(dirPath, { recursive: true });

		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await activateWithIpc(ext, state, koolDir, 'win-open');

		const ipcResponse = await invokeIpc(ext, koolDir, { op: 'open', path: dirPath });
		const expectedKey = normalizeKey(ext, dirPath);
		return mergeState(state, ipcResponse, { normalizedKey: expectedKey });
	});
}

async function ipcOpenTrailingSlash() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const dirPath = path.join(tempRoot, 'project');
		fs.mkdirSync(dirPath, { recursive: true });
		const pathWithSlash = `${dirPath}/`;

		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await activateWithIpc(ext, state, koolDir, 'win-open');

		const ipcResponse = await invokeIpc(ext, koolDir, { op: 'open', path: pathWithSlash });
		return mergeState(state, ipcResponse, { normalizedKey: normalizeKey(ext, dirPath) });
	});
}

async function ipcOpenFocusExisting() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const dirPath = path.join(tempRoot, 'existing');
		fs.mkdirSync(dirPath, { recursive: true });

		const state = {
			context: {},
			workspaceFolders: [workspaceFolder(dirPath)],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		await activateWithIpc(ext, state, koolDir, 'win-focus');

		const ipcResponse = await invokeIpc(ext, koolDir, { op: 'open', path: dirPath });
		return mergeState(state, ipcResponse, { normalizedKey: normalizeKey(ext, dirPath) });
	});
}

async function ipcOpenReplace() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const dirPath = path.join(tempRoot, 'replace-target');
		fs.mkdirSync(dirPath, { recursive: true });

		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await activateWithIpc(ext, state, koolDir, 'win-open-replace');

		const ipcResponse = await invokeIpc(ext, koolDir, { op: 'open', path: dirPath, replace: true });
		return mergeState(state, ipcResponse, { normalizedKey: normalizeKey(ext, dirPath) });
	});
}

async function ipcOpenNotDirectory() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const filePath = path.join(tempRoot, 'file.txt');
		fs.writeFileSync(filePath, 'hello', 'utf8');

		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await activateWithIpc(ext, state, koolDir, 'win-open');

		const ipcResponse = await invokeIpc(ext, koolDir, { op: 'open', path: filePath });
		return mergeState(state, ipcResponse);
	});
}

async function ipcOpenMissingPath() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await activateWithIpc(ext, state, koolDir, 'win-open');

		const ipcResponse = await invokeIpc(ext, koolDir, { op: 'open' });
		return mergeState(state, ipcResponse);
	});
}

async function ipcOpenNonexistentPath() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const missingPath = path.join(tempRoot, 'does-not-exist');

		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await activateWithIpc(ext, state, koolDir, 'win-open');

		const ipcResponse = await invokeIpc(ext, koolDir, { op: 'open', path: missingPath });
		return mergeState(state, ipcResponse);
	});
}

async function ipcGitOpenValidRepo() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const repoDir = path.join(tempRoot, 'repo');
		initGitRepo(repoDir);

		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await activateWithIpc(ext, state, koolDir, 'win-git');

		const ipcResponse = await invokeIpc(ext, koolDir, { op: 'git-open', path: repoDir });
		return mergeState(state, ipcResponse, { normalizedKey: normalizeKey(ext, repoDir) });
	});
}

async function ipcGitOpenNoGit() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const dirPath = path.join(tempRoot, 'plain');
		fs.mkdirSync(dirPath, { recursive: true });

		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await activateWithIpc(ext, state, koolDir, 'win-git');

		const ipcResponse = await invokeIpc(ext, koolDir, { op: 'git-open', path: dirPath });
		return mergeState(state, ipcResponse);
	});
}

async function ipcGitOpenNotDirectory() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const filePath = path.join(tempRoot, 'file.txt');
		fs.writeFileSync(filePath, 'not-a-dir', 'utf8');

		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await activateWithIpc(ext, state, koolDir, 'win-git');

		const ipcResponse = await invokeIpc(ext, koolDir, { op: 'git-open', path: filePath });
		return mergeState(state, ipcResponse);
	});
}

async function ipcUnknownOp() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await activateWithIpc(ext, state, koolDir, 'win-invalid');

		const ipcResponse = await invokeIpc(ext, koolDir, { op: 'nope' });
		return mergeState(state, ipcResponse);
	});
}

async function uriOpenFallback() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const dirPath = path.join(tempRoot, 'cold-start');
		fs.mkdirSync(dirPath, { recursive: true });

		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext('win-uri'));

		const uri = buildOpenUri(dirPath);
		const result = await invokeOpenUri(ext, state, uri);
		return mergeState(state, { ok: true }, {
			normalizedKey: normalizeKey(ext, dirPath),
			errorMessage: result?.errorMessage ?? state.errorMessage ?? '',
		});
	});
}

async function uriOpenFocusExisting() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const dirPath = path.join(tempRoot, 'existing');
		fs.mkdirSync(dirPath, { recursive: true });

		const state = {
			context: {},
			workspaceFolders: [workspaceFolder(dirPath)],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext('win-uri-focus'));

		const uri = buildOpenUri(dirPath);
		const result = await invokeOpenUri(ext, state, uri);
		return mergeState(state, { ok: true }, {
			normalizedKey: normalizeKey(ext, dirPath),
			errorMessage: result?.errorMessage ?? state.errorMessage ?? '',
		});
	});
}

async function uriOpenReplaceFallback() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const dirPath = path.join(tempRoot, 'replace-uri-target');
		fs.mkdirSync(dirPath, { recursive: true });

		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext('win-uri-replace'));

		const uri = buildOpenUri(dirPath, true);
		const result = await invokeOpenUri(ext, state, uri);
		return mergeState(state, { ok: true }, {
			normalizedKey: normalizeKey(ext, dirPath),
			errorMessage: result?.errorMessage ?? state.errorMessage ?? '',
		});
	});
}

async function uriOpenNotDirectory() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const filePath = path.join(tempRoot, 'file.txt');
		fs.writeFileSync(filePath, 'hello', 'utf8');

		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext('win-uri'));

		const uri = buildOpenUri(filePath);
		const result = await invokeOpenUri(ext, state, uri);
		return mergeState(state, { ok: false }, {
			errorMessage: result?.errorMessage ?? state.errorMessage ?? '',
		});
	});
}

async function uriOpenMissingPathQuery() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext('win-uri'));

		const uri = `vscode://${EXTENSION_ID}/open`;
		const result = await invokeOpenUri(ext, state, uri);
		return mergeState(state, { ok: false }, {
			errorMessage: result?.errorMessage ?? state.errorMessage ?? '',
		});
	});
}

async function uriOpenEmptyPathQuery() {
	return withHarness(async (tempRoot, koolDir, trackExtension) => {
		const state = { context: {} };
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext('win-uri'));

		const uri = `vscode://${EXTENSION_ID}/open?path=`;
		const result = await invokeOpenUri(ext, state, uri);
		return mergeState(state, { ok: false }, {
			errorMessage: result?.errorMessage ?? state.errorMessage ?? '',
		});
	});
}