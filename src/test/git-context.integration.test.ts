import * as assert from 'assert';
import * as vscode from 'vscode';
import {
	activate,
	discoverGitRepositoryPaths,
	getPublishedGitRepositoryPaths,
	toGitRepositoryContextKey,
} from '../extension';

const AI_CRITIC_X = '/Users/xhd2015/Projects/xhd2015/ai-critic/x';

suite('Git context integration', () => {
	test('discovers nested git repository ai-critic/x in workspace', async function () {
		this.timeout(60000);

		const workspaceFolders = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) ?? [];
		console.log('[git-context.integration] workspaceFolders:', workspaceFolders);

		const gitRepositoryPaths = await discoverGitRepositoryPaths();
		console.log('[git-context.integration] discovered paths:', gitRepositoryPaths);

		const normalizedTarget = toGitRepositoryContextKey(AI_CRITIC_X);
		assert.ok(
			gitRepositoryPaths.includes(normalizedTarget),
			`Expected ${normalizedTarget} in discovered paths: ${gitRepositoryPaths.join(', ')}`,
		);
	});

	test('activate finishes initial scan before returning', async function () {
		this.timeout(120000);

		const context = {
			subscriptions: [],
		} as unknown as vscode.ExtensionContext;

		await activate(context);

		const publishedPaths = getPublishedGitRepositoryPaths();
		console.log('[git-context.integration] published paths after activate:', publishedPaths);

		const normalizedTarget = toGitRepositoryContextKey(AI_CRITIC_X);
		assert.ok(
			publishedPaths.includes(normalizedTarget),
			`Expected ${normalizedTarget} in published paths: ${publishedPaths.join(', ')}`,
		);
	});

	test('normalized resource path matches discovered cache entry', () => {
		const normalizedTarget = toGitRepositoryContextKey(AI_CRITIC_X);
		const sampleCache = [
			toGitRepositoryContextKey('/Users/xhd2015/Projects/xhd2015/ai-critic'),
			normalizedTarget,
		];

		assert.ok(sampleCache.includes(normalizedTarget));
		assert.strictEqual(toGitRepositoryContextKey(`${AI_CRITIC_X}/`), normalizedTarget);
	});
});