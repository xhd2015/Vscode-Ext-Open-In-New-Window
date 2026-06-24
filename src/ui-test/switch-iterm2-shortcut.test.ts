import * as fs from 'node:fs';
import { expect } from 'chai';
import { VSBrowser } from 'vscode-extension-tester';
import {
	dismissBlockingOverlays,
	getQuickPickLabels,
	openWorkspace,
	waitForActionPickerItems,
	waitForCommandPaletteLabel,
} from './ui-test-helpers';

const SWITCH_SHORTCUT_COMMAND = 'open-in-new-window.switchITerm2Shortcut';
const SWITCH_SHORTCUT_LABEL_MATCH = (label: string) =>
	label.includes('Switch Shortcut') && !label.includes('Switch back');
const OPEN_ITERM2_ACTION = 'Open iTerm2';
const OPEN_ITERM2_GROK_ACTION = 'Open iTerm2: Grok';

describe('Switch Shortcut UI', function () {
	let workspaceRoot: string;

	before(async function () {
		if (process.platform !== 'darwin') {
			this.skip();
		}
		this.timeout(180_000);
		workspaceRoot = await openWorkspace('switch-iterm2-shortcut-ui-');
	});

	after(async function () {
		if (workspaceRoot && fs.existsSync(workspaceRoot)) {
			fs.rmSync(workspaceRoot, { recursive: true, force: true });
		}
	});

	it('shows action items after Switch Shortcut is selected', async function () {
		this.timeout(120_000);
		await dismissBlockingOverlays();

		const { input: commandPalette, label: switchShortcutLabel } = await waitForCommandPaletteLabel(
			SWITCH_SHORTCUT_COMMAND,
			SWITCH_SHORTCUT_LABEL_MATCH,
		);
		await commandPalette.selectQuickPick(switchShortcutLabel);
		await VSBrowser.instance.driver.sleep(1_500);

		const shortcutPicker = await waitForActionPickerItems([
			OPEN_ITERM2_ACTION,
			OPEN_ITERM2_GROK_ACTION,
		]);
		const actionLabels = await getQuickPickLabels(shortcutPicker);
		expect(actionLabels, 'Switch Shortcut action picker labels').to.include(OPEN_ITERM2_ACTION);
		expect(actionLabels, 'Switch Shortcut action picker labels').to.include(OPEN_ITERM2_GROK_ACTION);

		await shortcutPicker.cancel();
		await dismissBlockingOverlays();
	});
});