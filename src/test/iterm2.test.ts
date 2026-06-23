import * as assert from 'assert';
import {
	buildOpenITerm2Script,
	escapePathForAppleScript,
	isITerm2Installed,
	ITERM2_APP_PATH,
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

	test('buildOpenITerm2Script creates a new window and cds via write text', () => {
		const script = buildOpenITerm2Script('/tmp/proj');
		assert.match(script, /create window with default profile/);
		assert.doesNotMatch(script, /create tab/);
		assert.match(script, /set targetDir to "\/tmp\/proj"/);
		assert.match(script, /write text \("cd " & quoted form of targetDir\)/);
		assert.doesNotMatch(script, /exec \$SHELL/);
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