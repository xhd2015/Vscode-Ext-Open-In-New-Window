import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const iterm2Path = path.resolve(import.meta.dirname, '../../../../out/iterm2.js');

function loadITerm2Module() {
	delete require.cache[iterm2Path];
	return require(iterm2Path);
}

function analyzeScript(script) {
	return {
		script,
		usesCreateWindow: script.includes('create window with default profile'),
		usesCreateTab: script.includes('create tab with default profile'),
		usesPathScan: script.includes('variable named "path"'),
		usesTellSessionAccess: script.includes('tell aSession'),
		usesInvalidPathAccess: script.includes('variable named "path" of aSession'),
		usesOnErrorHandler: script.includes('on error'),
	};
}

export async function runScenario(request) {
	const iterm2 = loadITerm2Module();

	switch (request.scenario) {
	case 'script-smart-open-branches':
	case 'script-uses-tell-session-access':
	case 'script-uses-on-error-handler': {
		const script = iterm2.buildOpenITerm2Script(request.testPath ?? '/tmp/proj');
		return analyzeScript(script);
	}
	case 'live-scan-smoke': {
		if (process.platform !== 'darwin') {
			return { skipped: true, skipReason: 'not-macos' };
		}
		if (!iterm2.isITerm2Installed()) {
			return { skipped: true, skipReason: 'iterm-not-installed' };
		}
		const script = iterm2.buildPathScanSmokeScript();
		try {
			const stdout = execFileSync('osascript', ['-e', script], { encoding: 'utf8' }).trim();
			return {
				ok: stdout === 'ok',
				stdout,
				script,
				skipped: false,
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return {
				ok: false,
				error: message,
				script,
				skipped: false,
			};
		}
	}
	default:
		throw new Error(`unknown scenario: ${request.scenario}`);
	}
}