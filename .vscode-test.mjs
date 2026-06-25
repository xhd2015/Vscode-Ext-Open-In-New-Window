import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@vscode/test-cli';
import { createGitContextWorkspace } from './script/create-git-context-workspace.mjs';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const gitContextFixture = path.join(projectRoot, 'src/test/fixtures/git-context-workspace');
const gitContextWorkspace = createGitContextWorkspace(gitContextFixture);

export default defineConfig([
	{
		label: 'unit',
		version: '1.124.2',
		files: ['out/test/extension.test.js', 'out/test/iterm2.test.js'],
	},
	{
		label: 'git-context-integration',
		version: '1.124.2',
		files: 'out/test/git-context.integration.test.js',
		workspaceFolder: gitContextWorkspace,
		mocha: {
			timeout: 120000,
		},
	},
]);