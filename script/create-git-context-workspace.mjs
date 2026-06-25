import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

function copyNonGitFiles(sourceRoot, destRoot) {
	fs.mkdirSync(destRoot, { recursive: true });

	for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
		if (entry.name === '.git') {
			continue;
		}

		const sourcePath = path.join(sourceRoot, entry.name);
		const destPath = path.join(destRoot, entry.name);

		if (entry.isDirectory()) {
			copyNonGitFiles(sourcePath, destPath);
			continue;
		}

		fs.copyFileSync(sourcePath, destPath);
	}
}

export function createGitContextWorkspace(fixtureRoot) {
	const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'git-context-workspace-'));
	copyNonGitFiles(fixtureRoot, workspaceRoot);

	execSync('git init -q', { cwd: workspaceRoot });
	execSync('git init -q', { cwd: path.join(workspaceRoot, 'x') });

	return workspaceRoot;
}