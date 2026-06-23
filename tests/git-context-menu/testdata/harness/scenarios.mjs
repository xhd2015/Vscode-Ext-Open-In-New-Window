import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createVscodeMock } from './vscode-mock.mjs';
import {
	createNestedScanDelayTree,
	initGitRepo,
	writeWorktreeGitFile,
} from './fixtures.mjs';

const require = createRequire(import.meta.url);
const extensionPath = path.resolve(import.meta.dirname, '../../../../out/extension.js');

const VSCODE_STUB = '\0vscode-mock';

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
		extensionMode, // vscode.ExtensionMode.Test
	};
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeKey(ext, fsPath) {
	return ext.toGitRepositoryContextKey(fsPath);
}

const GIT_REPOSITORY_PATH_KEYS_CONTEXT = 'openInNewWindow.gitRepositoryPathKeys';

function menuWouldShow(ext, publishedPaths, resourcePath) {
	const key = ext.toGitRepositoryContextKey(resourcePath);
	return publishedPaths.includes(key);
}

function menuWouldShowViaWhenClause(pathKeys, resourcePath, resourceFilename) {
	if (!pathKeys || Array.isArray(pathKeys) || typeof pathKeys !== 'object') {
		return false;
	}
	return pathKeys[resourcePath] === true || pathKeys[resourceFilename] === true;
}

async function withTempWorkspace(fn) {
	const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'git-context-menu-'));
	let extension;
	try {
		return await fn(workspaceRoot, (ext) => {
			extension = ext;
		});
	} finally {
		extension?.deactivate();
		fs.rmSync(workspaceRoot, { recursive: true, force: true });
	}
}

export async function runScenario(request) {
	switch (request.scenario) {
	case 'activation-no-empty-publish':
		return activationNoEmptyPublish();
	case 'activation-all-repos-after-complete':
		return activationAllReposAfterComplete();
	case 'scan-incremental-before-complete':
		return scanIncrementalBeforeComplete();
	case 'scan-nested-repo-discovered':
		return scanNestedRepoDiscovered();
	case 'refresh-watcher-survives':
		return refreshWatcherSurvives();
	case 'watcher-git-delete-still-exists':
		return watcherGitDeleteStillExists();
	case 'watcher-git-create-adds-path':
		return watcherGitCreateAddsPath();
	case 'watcher-git-delete-actually-gone':
		return watcherGitDeleteActuallyGone();
	case 'normalize-trailing-slash':
		return normalizeTrailingSlash(request);
	case 'normalize-dot-segments':
		return normalizeDotSegments(request);
	case 'normalize-parent-segments':
		return normalizeParentSegments(request);
	case 'discovery-worktree-git-file':
		return discoveryWorktreeGitFile();
	case 'discovery-skipped-node-modules':
		return discoverySkippedNodeModules();
	case 'menu-direct-match':
		return menuDirectMatch();
	case 'menu-trailing-slash-resource':
		return menuTrailingSlashResource();
	case 'menu-realpath-resource':
		return menuRealpathResource();
	case 'menu-symlink-resource':
		return menuSymlinkResource();
	case 'menu-path-keys-object-map':
		return menuPathKeysObjectMap();
	case 'menu-resource-filename-match':
		return menuResourceFilenameMatch();
	default:
		throw new Error(`unknown scenario: ${request.scenario}`);
	}
}

async function activationNoEmptyPublish() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const rootRepo = path.join(workspaceRoot, 'root-repo');
		initGitRepo(rootRepo);

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const firstPublish = state.contextPublishHistory[0] ?? [];
		return {
			contextPublishHistory: state.contextPublishHistory,
			firstPublishEmpty: firstPublish.length === 0,
			publishedPaths: [...ext.getPublishedGitRepositoryPaths()],
		};
	});
}

async function activationAllReposAfterComplete() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const rootRepo = path.join(workspaceRoot, 'root-repo');
		const nestedRepo = path.join(workspaceRoot, 'nested', 'child-repo');
		initGitRepo(rootRepo);
		initGitRepo(nestedRepo);

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const published = [...ext.getPublishedGitRepositoryPaths()];
		const expected = [
			normalizeKey(ext, rootRepo),
			normalizeKey(ext, nestedRepo),
		];
		return {
			publishedPaths: published,
			expectedPaths: expected,
			allExpectedPresent: expected.every((entry) => published.includes(entry)),
		};
	});
}

async function scanIncrementalBeforeComplete() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const rootRepo = path.join(workspaceRoot, 'root-repo');
		initGitRepo(rootRepo);

		const delayParent = createNestedScanDelayTree(workspaceRoot, 10);
		const nestedRepo = path.join(delayParent, 'nested-repo');
		initGitRepo(nestedRepo);

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);

		const rootKey = normalizeKey(ext, rootRepo);
		const nestedKey = normalizeKey(ext, nestedRepo);
		const activatePromise = ext.activate(makeContext());

		let depth0PublishedBeforeNested = false;
		for (let i = 0; i < 200; i++) {
			const history = state.contextPublishHistory;
			const rootPublishedEarly = history.some(
				(snapshot) => snapshot.includes(rootKey) && !snapshot.includes(nestedKey),
			);
			if (rootPublishedEarly) {
				depth0PublishedBeforeNested = true;
				break;
			}
			await sleep(25);
		}

		await activatePromise;
		return {
			depth0PublishedBeforeComplete: depth0PublishedBeforeNested,
			contextPublishHistory: state.contextPublishHistory,
			publishedPaths: [...ext.getPublishedGitRepositoryPaths()],
			rootKey,
		};
	});
}

async function scanNestedRepoDiscovered() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const nestedRepo = path.join(workspaceRoot, 'x');
		initGitRepo(nestedRepo);

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		const discovered = await ext.discoverGitRepositoryPaths();
		const normalized = normalizeKey(ext, nestedRepo);

		return {
			discoveredPaths: discovered,
			normalizedKey: normalized,
			nestedPresent: discovered.includes(normalized),
		};
	});
}

async function refreshWatcherSurvives() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const rootRepo = path.join(workspaceRoot, 'root-repo');
		initGitRepo(rootRepo);

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const watcherRepo = path.join(workspaceRoot, 'watcher-repo');
		initGitRepo(watcherRepo);
		const watcherKey = normalizeKey(ext, watcherRepo);

		if (typeof ext.TestExported_refreshGitRepositoryPathsContext !== 'function') {
			return {
				watcherKey,
				publishedPaths: [...ext.getPublishedGitRepositoryPaths()],
				watcherPathSurvived: false,
			};
		}

		const refresh = ext.TestExported_refreshGitRepositoryPathsContext('test-refresh');
		await ext.handleWorkspacePathCreated({ fsPath: path.join(watcherRepo, '.git'), scheme: 'file' });
		await refresh;

		const published = [...ext.getPublishedGitRepositoryPaths()];
		return {
			watcherKey,
			publishedPaths: published,
			watcherPathSurvived: published.includes(watcherKey),
		};
	});
}

async function watcherGitDeleteStillExists() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const repoDir = path.join(workspaceRoot, 'repo');
		initGitRepo(repoDir);

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const repoKey = normalizeKey(ext, repoDir);
		const gitMetadata = path.join(repoDir, '.git');
		await ext.handleWorkspacePathDeleted({ fsPath: gitMetadata, scheme: 'file' });

		const published = [...ext.getPublishedGitRepositoryPaths()];
		return {
			repoKey,
			publishedPaths: published,
			pathInCacheAfterDelete: published.includes(repoKey),
			gitStillExists: fs.existsSync(gitMetadata),
		};
	});
}

async function watcherGitCreateAddsPath() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const repoDir = path.join(workspaceRoot, 'new-repo');
		fs.mkdirSync(repoDir, { recursive: true });

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		initGitRepo(repoDir);
		await ext.handleWorkspacePathCreated({ fsPath: path.join(repoDir, '.git'), scheme: 'file' });

		const repoKey = normalizeKey(ext, repoDir);
		const published = [...ext.getPublishedGitRepositoryPaths()];
		return {
			repoKey,
			publishedPaths: published,
			pathAdded: published.includes(repoKey),
		};
	});
}

async function watcherGitDeleteActuallyGone() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const repoDir = path.join(workspaceRoot, 'repo');
		initGitRepo(repoDir);

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const repoKey = normalizeKey(ext, repoDir);
		const gitMetadata = path.join(repoDir, '.git');
		fs.rmSync(gitMetadata, { recursive: true, force: true });
		await ext.handleWorkspacePathDeleted({ fsPath: gitMetadata, scheme: 'file' });

		const published = [...ext.getPublishedGitRepositoryPaths()];
		return {
			repoKey,
			publishedPaths: published,
			pathRemoved: !published.includes(repoKey),
			gitGone: !fs.existsSync(gitMetadata),
		};
	});
}

async function normalizeTrailingSlash(request) {
	const state = { workspaceFolders: [], context: {}, contextPublishHistory: [] };
	const ext = loadExtension(state);
	const normalized = ext.toGitRepositoryContextKey(request.normalizeInput);
	return { normalizedKey: normalized };
}

async function normalizeDotSegments(request) {
	const state = { workspaceFolders: [], context: {}, contextPublishHistory: [] };
	const ext = loadExtension(state);
	const normalized = ext.toGitRepositoryContextKey(request.normalizeInput);
	return { normalizedKey: normalized };
}

async function normalizeParentSegments(request) {
	const state = { workspaceFolders: [], context: {}, contextPublishHistory: [] };
	const ext = loadExtension(state);
	const normalized = ext.toGitRepositoryContextKey(request.normalizeInput);
	return { normalizedKey: normalized };
}

async function discoveryWorktreeGitFile() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const mainRepo = path.join(workspaceRoot, 'main');
		const worktreeRepo = path.join(workspaceRoot, 'worktree');
		initGitRepo(mainRepo);
		const gitdir = path.join(mainRepo, '.git');
		writeWorktreeGitFile(worktreeRepo, gitdir);

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		const discovered = await ext.discoverGitRepositoryPaths();
		const worktreeKey = normalizeKey(ext, worktreeRepo);
		const isGit = await ext.isGitRepository({ fsPath: worktreeRepo, scheme: 'file' });

		return {
			discoveredPaths: discovered,
			worktreeKey,
			worktreePresent: discovered.includes(worktreeKey),
			isGitRepository: isGit,
		};
	});
}

async function discoverySkippedNodeModules() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const hiddenRepo = path.join(workspaceRoot, 'node_modules', 'pkg', 'hidden-repo');
		initGitRepo(hiddenRepo);

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		const discovered = await ext.discoverGitRepositoryPaths();
		const hiddenKey = normalizeKey(ext, hiddenRepo);

		return {
			discoveredPaths: discovered,
			hiddenKey,
			hiddenSkipped: !discovered.includes(hiddenKey),
		};
	});
}

async function menuDirectMatch() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const repoDir = path.join(workspaceRoot, 'repo');
		initGitRepo(repoDir);

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const published = [...ext.getPublishedGitRepositoryPaths()];
		return {
			menuWouldShow: menuWouldShow(ext, published, repoDir),
			publishedPaths: published,
		};
	});
}

async function menuTrailingSlashResource() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const repoDir = path.join(workspaceRoot, 'repo');
		initGitRepo(repoDir);

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const published = [...ext.getPublishedGitRepositoryPaths()];
		const resourcePath = `${repoDir}${path.sep}`;
		return {
			menuWouldShow: menuWouldShow(ext, published, resourcePath),
			publishedPaths: published,
			resourcePath,
		};
	});
}

async function menuRealpathResource() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const repoDir = path.join(workspaceRoot, 'repo');
		initGitRepo(repoDir);

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const published = [...ext.getPublishedGitRepositoryPaths()];
		const publishedKey = published[0] ?? '';
		const vscodeResourcePath = fs.realpathSync(repoDir);

		return {
			menuWouldShow: menuWouldShow(ext, published, vscodeResourcePath),
			publishedPaths: published,
			resourcePath: repoDir,
			vscodeResourcePath,
			publishedKey,
		};
	});
}

async function menuSymlinkResource() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const realRepo = path.join(workspaceRoot, 'real-repo');
		const linkRepo = path.join(workspaceRoot, 'link-repo');
		initGitRepo(realRepo);
		fs.symlinkSync(realRepo, linkRepo, 'dir');

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const published = [...ext.getPublishedGitRepositoryPaths()];
		const publishedKey = normalizeKey(ext, realRepo);
		const vscodeResourcePath = linkRepo;

		return {
			menuWouldShow: menuWouldShow(ext, published, vscodeResourcePath),
			publishedPaths: published,
			resourcePath: realRepo,
			vscodeResourcePath,
			publishedKey,
		};
	});
}

async function menuPathKeysObjectMap() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		const repoDir = path.join(workspaceRoot, 'repo');
		initGitRepo(repoDir);

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const pathKeys = state.context[GIT_REPOSITORY_PATH_KEYS_CONTEXT];
		const pathsContext = state.context['openInNewWindow.gitRepositoryPaths'];
		const repoKey = normalizeKey(ext, repoDir);

		return {
			pathKeysIsObject: pathKeys !== null
				&& typeof pathKeys === 'object'
				&& !Array.isArray(pathKeys),
			pathsContextIsArray: Array.isArray(pathsContext),
			publishedPathKeys: pathKeys ?? {},
			publishedPaths: [...ext.getPublishedGitRepositoryPaths()],
			repoKey,
			hasFullPathKey: pathKeys?.[repoKey] === true,
			hasBasenameKey: pathKeys?.['repo'] === true,
		};
	});
}

async function menuResourceFilenameMatch() {
	return withTempWorkspace(async (workspaceRoot, trackExtension) => {
		initGitRepo(workspaceRoot);
		const nestedRepo = path.join(workspaceRoot, 'x');
		initGitRepo(nestedRepo);

		const state = {
			workspaceFolders: [{ uri: { fsPath: workspaceRoot, scheme: 'file' }, name: 'ws', index: 0 }],
			context: {},
			contextPublishHistory: [],
		};
		const ext = loadExtension(state);
		trackExtension(ext);
		await ext.activate(makeContext());

		const published = [...ext.getPublishedGitRepositoryPaths()];
		const pathKeys = state.context[GIT_REPOSITORY_PATH_KEYS_CONTEXT];
		const nestedKey = normalizeKey(ext, nestedRepo);
		const resourceFilename = 'x';

		return {
			resourceFilename,
			resourcePath: nestedKey,
			publishedPathKeys: pathKeys ?? {},
			publishedPaths: published,
			menuWouldShowViaPathKeys: menuWouldShowViaWhenClause(pathKeys, nestedKey, resourceFilename),
			menuWouldShowViaArrayIncludes: menuWouldShow(ext, published, resourceFilename),
		};
	});
}