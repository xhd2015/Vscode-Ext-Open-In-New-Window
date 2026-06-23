import { defineConfig } from '@vscode/test-cli';

export default defineConfig([
	{
		version: '1.124.2',
		files: 'out/test/**/*.test.js',
		exclude: ['out/test/git-context.integration.test.js'],
	},
	{
		label: 'git-context-ai-critic',
		version: '1.124.2',
		files: 'out/test/git-context.integration.test.js',
		workspaceFolder: '/Users/xhd2015/Projects/xhd2015/ai-critic',
		mocha: {
			timeout: 120000,
		},
	},
]);