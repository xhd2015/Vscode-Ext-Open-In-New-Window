import * as assert from 'assert';
import * as vscode from 'vscode';
import {
	getRepositoryPathForGitMetadata,
	isDevelopmentMode,
	toGitRepositoryContextKey,
} from '../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('isDevelopmentMode is true only for ExtensionMode.Development', () => {
		assert.strictEqual(isDevelopmentMode(vscode.ExtensionMode.Development), true);
		assert.strictEqual(isDevelopmentMode(vscode.ExtensionMode.Production), false);
		assert.strictEqual(isDevelopmentMode(vscode.ExtensionMode.Test), false);
	});

	test('getRepositoryPathForGitMetadata resolves worktree .git file paths', () => {
		assert.strictEqual(
			getRepositoryPathForGitMetadata('/Users/example/project/worktree-a/.git'),
			'/Users/example/project/worktree-a',
		);
	});

	test('toGitRepositoryContextKey normalizes repository paths for menu matching', () => {
		assert.strictEqual(
			toGitRepositoryContextKey('/Users/example/ai-critic/x/'),
			'/Users/example/ai-critic/x',
		);
	});
});
