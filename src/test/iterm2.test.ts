import * as assert from 'assert';
import {
	buildOpenITerm2Script,
	buildPathScanSmokeScript,
	buildSessionCommandLines,
	escapePathForAppleScript,
	isITerm2Installed,
	ITERM2_APP_PATH,
	normalizeTargetDirectory,
	resolveTargetDirectory,
} from '../iterm2';

suite('iTerm2 Test Suite', () => {
	test('resolveTargetDirectory uses first workspace folder', () => {
		const folders = [{ uri: { fsPath: '/tmp/proj' } }];
		assert.strictEqual(resolveTargetDirectory(folders, '/Users/me'), '/tmp/proj');
	});

	test('resolveTargetDirectory falls back to home', () => {
		assert.strictEqual(resolveTargetDirectory(undefined, '/Users/me'), '/Users/me');
		assert.strictEqual(resolveTargetDirectory([], '/Users/me'), '/Users/me');
	});

	test('resolveTargetDirectory uses first folder in multi-root workspace', () => {
		const folders = [
			{ uri: { fsPath: '/workspace/a' } },
			{ uri: { fsPath: '/workspace/b' } },
		];
		assert.strictEqual(resolveTargetDirectory(folders, '/Users/me'), '/workspace/a');
	});

	test('escapePathForAppleScript escapes double quotes', () => {
		assert.strictEqual(escapePathForAppleScript('/tmp/"proj"'), '/tmp/\\"proj\\"');
	});

	test('buildOpenITerm2Script reuses a matching window via new tab with window fallback', () => {
		const script = buildOpenITerm2Script('/tmp/proj');
		assert.match(script, /set targetDir to "\/tmp\/proj"/);
		assert.match(script, /tell aSession[\s\S]*variable named "path"/);
		assert.match(script, /on error/);
		assert.doesNotMatch(script, /variable named "path" of aSession/);
		assert.match(script, /matchingWindow/);
		assert.match(script, /is hotkey window/);
		assert.match(script, /create tab with default profile/);
		assert.match(script, /create window with default profile/);
		assert.match(script, /write text \("cd " & quoted form of targetDir\)/);
		assert.doesNotMatch(script, /exec \$SHELL/);
	});

	test('buildPathScanSmokeScript reads session path via tell aSession', () => {
		const script = buildPathScanSmokeScript();
		assert.match(script, /tell aSession/);
		assert.match(script, /on error/);
		assert.doesNotMatch(script, /variable named "path" of aSession/);
	});

	test('buildSessionCommandLines includes follow-up commands', () => {
		const lines = buildSessionCommandLines(['grok']);
		assert.match(lines.join('\n'), /write text "grok"/);
	});

	test('normalizeTargetDirectory resolves existing paths', () => {
		const normalized = normalizeTargetDirectory('/tmp/proj', {
			existsSync: () => true,
			realpathSync: () => '/private/tmp/proj',
		});
		assert.strictEqual(normalized, '/private/tmp/proj');
	});

	test('normalizeTargetDirectory keeps original path when missing', () => {
		const normalized = normalizeTargetDirectory('/tmp/missing', {
			existsSync: () => false,
		});
		assert.strictEqual(normalized, '/tmp/missing');
	});

	test('isITerm2Installed checks the iTerm.app path', () => {
		const seen: string[] = [];
		const exists = (targetPath: string) => {
			seen.push(targetPath);
			return targetPath === ITERM2_APP_PATH;
		};
		assert.strictEqual(isITerm2Installed(exists), true);
		assert.deepStrictEqual(seen, [ITERM2_APP_PATH]);
	});
});