import * as fs from 'node:fs';
import { expect } from 'chai';
import { VSBrowser } from 'vscode-extension-tester';
import {
	dismissBlockingOverlays,
	openWorkspace,
	waitForCommandPaletteLabel,
} from './ui-test-helpers';

const COMMAND_ID = 'open-in-new-window.openITerm2';
const COMMAND_LABEL_MATCH = (label: string) => label.includes('Open iTerm2');

describe('Open iTerm2 command palette UI', function () {
	let workspaceRoot: string;

	before(async function () {
		if (process.platform !== 'darwin') {
			this.skip();
		}
		this.timeout(180_000);
		workspaceRoot = await openWorkspace('open-iterm2-ui-');
	});

	after(async function () {
		if (workspaceRoot && fs.existsSync(workspaceRoot)) {
			fs.rmSync(workspaceRoot, { recursive: true, force: true });
		}
	});

	it('shows Open iTerm2 in the command palette and executes without error', async function () {
		this.timeout(120_000);
		await dismissBlockingOverlays();

		const { input, label } = await waitForCommandPaletteLabel(COMMAND_ID, COMMAND_LABEL_MATCH);
		expect(label, 'command palette label').to.include('Open iTerm2');

		await input.selectQuickPick(label);
		await VSBrowser.instance.driver.sleep(500);
		await dismissBlockingOverlays();
	});
});