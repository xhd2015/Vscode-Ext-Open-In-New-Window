import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export function ensureDir(dirPath) {
	fs.mkdirSync(dirPath, { recursive: true });
}

export function initGitRepo(dirPath) {
	ensureDir(dirPath);
	execSync('git init', { cwd: dirPath, stdio: 'ignore' });
}

export function writeWorktreeGitFile(repoDir, gitdirPath) {
	ensureDir(repoDir);
	fs.writeFileSync(path.join(repoDir, '.git'), `gitdir: ${gitdirPath}\n`, 'utf8');
}