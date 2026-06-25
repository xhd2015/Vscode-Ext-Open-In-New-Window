import * as assert from 'assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import {
	activate,
	discoverGitRepositoryPaths,
	getPublishedGitRepositoryPaths,
	toGitRepositoryContextKey,
} from '../extension';

function getWorkspacePaths(): { workspaceRoot: string; nestedRepo: string } {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	assert.ok(
		workspaceFolders && workspaceFolders.length > 0,
		'Expected git-context workspace to be open',
	);
	const workspaceRoot = workspaceFolders[0].uri.fsPath;
	const nestedRepo = path.join(workspaceRoot, 'x');

	assert.ok(
		fs.existsSync(path.join(workspaceRoot, '.git')),
		`Expected runtime git repo at workspace root ${workspaceRoot}`,
	);
	assert.ok(
		fs.existsSync(path.join(nestedRepo, '.git')),
		`Expected runtime nested git repo at ${nestedRepo}`,
	);

	return {
		workspaceRoot,
		nestedRepo,
	};
}

suite('Git context integration', () => {
	test('discovers nested git repository x/ in workspace', async function () {
		this.timeout(60000);

		const { workspaceRoot, nestedRepo } = getWorkspacePaths();
		const workspaceFolders = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) ?? [];
		console.log('[git-context.integration] workspaceFolders:', workspaceFolders);

		const gitRepositoryPaths = await discoverGitRepositoryPaths();
		console.log('[git-context.integration] discovered paths:', gitRepositoryPaths);

		const normalizedTarget = toGitRepositoryContextKey(nestedRepo);
		assert.ok(
			gitRepositoryPaths.includes(normalizedTarget),
			`Expected ${normalizedTarget} in discovered paths: ${gitRepositoryPaths.join(', ')}`,
		);
		assert.ok(
			workspaceFolders.includes(workspaceRoot),
			`Expected workspace root ${workspaceRoot} in workspaceFolders`,
		);
	});

	test('activate finishes initial scan before returning', async function () {
		this.timeout(120000);

		const { nestedRepo } = getWorkspacePaths();
		const context = {
			subscriptions: [],
		} as unknown as vscode.ExtensionContext;

		await activate(context);

		const publishedPaths = getPublishedGitRepositoryPaths();
		console.log('[git-context.integration] published paths after activate:', publishedPaths);

		const normalizedTarget = toGitRepositoryContextKey(nestedRepo);
		assert.ok(
			publishedPaths.includes(normalizedTarget),
			`Expected ${normalizedTarget} in published paths: ${publishedPaths.join(', ')}`,
		);
	});

	test('normalized resource path matches discovered cache entry', () => {
		const { workspaceRoot, nestedRepo } = getWorkspacePaths();
		const normalizedTarget = toGitRepositoryContextKey(nestedRepo);
		const sampleCache = [
			toGitRepositoryContextKey(workspaceRoot),
			normalizedTarget,
		];

		assert.ok(sampleCache.includes(normalizedTarget));
		assert.strictEqual(toGitRepositoryContextKey(`${nestedRepo}/`), normalizedTarget);
	});
});