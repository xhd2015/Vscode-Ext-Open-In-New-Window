import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createVscodeMock } from './vscode-mock.mjs';
import { initGitRepo, writeWorktreeGitFile } from './fixtures.mjs';

const require = createRequire(import.meta.url);
const extensionPath = path.resolve(import.meta.dirname, '../../../../out/extension.js');
const VSCODE_STUB = '\0vscode-mock';
const EXTENSION_ID = 'xhd2015.open-in-new-window';

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

function makeContext(extensionMode = 3) {
	return {
		subscriptions: [],
		extensionMode,
	};
}

function buildGitOpenUri(repoPath) {
	const encoded = encodeURIComponent(repoPath);
	return `vscode://${EXTENSION_ID}/git-open?path=${encoded}`;
}

function normalizeKey(ext, fsPath) {
	return ext.toGitRepositoryContextKey(fsPath);
}

async function withTempDir(fn) {
	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'git-open-cli-'));
	let extension;
	try {
		return await fn(tempRoot, (ext) => {
			extension = ext;
		});
	} finally {
		extension?.deactivate();
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
}

async function invokeGitOpenUri(ext, state, uriString) {
	if (typeof ext.TestExported_handleGitOpenUri !== 'function') {
		throw new Error('TestExported_handleGitOpenUri is not exported from extension');
	}
	return ext.TestExported_handleGitOpenUri(uriString, state);
}

export async function runScenario(request) {
	switch (request.scenario) {
	case 'uri-valid-path':
		return uriValidPath();
	case 'uri-encoded-path':
		return uriEncodedPath();
	case 'uri-trailing-slash':
		return uriTrailingSlash();
	case 'uri-worktree-git-file':
		return uriWorktreeGitFile();
	case 'uri-missing-path-query':
		return uriMissingPathQuery();
	case 'uri-empty-path-query':
		return uriEmptyPathQuery();
	case 'uri-not-directory':
		return uriNotDirectory();
	case 'uri-no-git':
		return uriNoGit();
	default:
		throw new Error(`unknown scenario: ${request.scenario}`);
	}
}

async function uriValidPath() {
	return withTempDir(async (tempRoot, trackExtension) => {
		const repoDir = path.join(tempRoot, 'repo');
		initGitRepo(repoDir);

		const state = { context: {}, gitOpenCalled: false, gitOpenPath: '' };
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const uri = buildGitOpenUri(repoDir);
		const result = await invokeGitOpenUri(ext, state, uri);
		const expectedKey = normalizeKey(ext, repoDir);

		return {
			gitOpenCalled: state.gitOpenCalled,
			gitOpenPath: state.gitOpenPath,
			errorMessage: result?.errorMessage ?? state.errorMessage ?? '',
			normalizedKey: expectedKey,
		};
	});
}

async function uriEncodedPath() {
	return withTempDir(async (tempRoot, trackExtension) => {
		const repoDir = path.join(tempRoot, 'my repo');
		initGitRepo(repoDir);

		const state = { context: {}, gitOpenCalled: false, gitOpenPath: '' };
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const uri = buildGitOpenUri(repoDir);
		const result = await invokeGitOpenUri(ext, state, uri);

		return {
			gitOpenCalled: state.gitOpenCalled,
			gitOpenPath: state.gitOpenPath,
			errorMessage: result?.errorMessage ?? state.errorMessage ?? '',
			normalizedKey: normalizeKey(ext, repoDir),
		};
	});
}

async function uriTrailingSlash() {
	return withTempDir(async (tempRoot, trackExtension) => {
		const repoDir = path.join(tempRoot, 'repo');
		initGitRepo(repoDir);
		const pathWithSlash = `${repoDir}/`;

		const state = { context: {}, gitOpenCalled: false, gitOpenPath: '' };
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const uri = buildGitOpenUri(pathWithSlash);
		const result = await invokeGitOpenUri(ext, state, uri);

		return {
			gitOpenCalled: state.gitOpenCalled,
			gitOpenPath: state.gitOpenPath,
			errorMessage: result?.errorMessage ?? state.errorMessage ?? '',
			normalizedKey: normalizeKey(ext, repoDir),
		};
	});
}

async function uriWorktreeGitFile() {
	return withTempDir(async (tempRoot, trackExtension) => {
		const mainRepo = path.join(tempRoot, 'main');
		const worktreeRepo = path.join(tempRoot, 'worktree');
		initGitRepo(mainRepo);
		const gitdir = path.join(mainRepo, '.git');
		writeWorktreeGitFile(worktreeRepo, gitdir);

		const state = { context: {}, gitOpenCalled: false, gitOpenPath: '' };
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const uri = buildGitOpenUri(worktreeRepo);
		const result = await invokeGitOpenUri(ext, state, uri);

		return {
			gitOpenCalled: state.gitOpenCalled,
			gitOpenPath: state.gitOpenPath,
			errorMessage: result?.errorMessage ?? state.errorMessage ?? '',
			normalizedKey: normalizeKey(ext, worktreeRepo),
		};
	});
}

async function uriMissingPathQuery() {
	return withTempDir(async (tempRoot, trackExtension) => {
		const state = { context: {}, gitOpenCalled: false, gitOpenPath: '' };
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const uri = `vscode://${EXTENSION_ID}/git-open`;
		const result = await invokeGitOpenUri(ext, state, uri);

		return {
			gitOpenCalled: state.gitOpenCalled,
			gitOpenPath: state.gitOpenPath,
			errorMessage: result?.errorMessage ?? state.errorMessage ?? '',
		};
	});
}

async function uriEmptyPathQuery() {
	return withTempDir(async (tempRoot, trackExtension) => {
		const state = { context: {}, gitOpenCalled: false, gitOpenPath: '' };
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const uri = `vscode://${EXTENSION_ID}/git-open?path=`;
		const result = await invokeGitOpenUri(ext, state, uri);

		return {
			gitOpenCalled: state.gitOpenCalled,
			gitOpenPath: state.gitOpenPath,
			errorMessage: result?.errorMessage ?? state.errorMessage ?? '',
		};
	});
}

async function uriNotDirectory() {
	return withTempDir(async (tempRoot, trackExtension) => {
		const filePath = path.join(tempRoot, 'not-a-dir.txt');
		fs.writeFileSync(filePath, 'hello', 'utf8');

		const state = { context: {}, gitOpenCalled: false, gitOpenPath: '' };
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const uri = buildGitOpenUri(filePath);
		const result = await invokeGitOpenUri(ext, state, uri);

		return {
			gitOpenCalled: state.gitOpenCalled,
			gitOpenPath: state.gitOpenPath,
			errorMessage: result?.errorMessage ?? state.errorMessage ?? '',
		};
	});
}

async function uriNoGit() {
	return withTempDir(async (tempRoot, trackExtension) => {
		const dirPath = path.join(tempRoot, 'plain-dir');
		fs.mkdirSync(dirPath, { recursive: true });

		const state = { context: {}, gitOpenCalled: false, gitOpenPath: '' };
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const uri = buildGitOpenUri(dirPath);
		const result = await invokeGitOpenUri(ext, state, uri);

		return {
			gitOpenCalled: state.gitOpenCalled,
			gitOpenPath: state.gitOpenPath,
			errorMessage: result?.errorMessage ?? state.errorMessage ?? '',
		};
	});
}