import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { expect } from 'chai';
import {
	InputBox,
	Key,
	VSBrowser,
	Workbench,
} from 'vscode-extension-tester';

const COMMAND_LABEL = 'Open iTerm2';
const COMMAND_SEARCH = 'Open iTerm2';

async function dismissBlockingOverlays(): Promise<void> {
	const driver = VSBrowser.instance.driver;
	for (let attempt = 0; attempt < 4; attempt++) {
		await driver.actions().sendKeys(Key.ESCAPE).perform();
		await driver.sleep(250);
	}
}

async function openWorkspace(): Promise<string> {
	const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'open-iterm2-ui-'));
	const markerPath = path.join(workspaceRoot, 'marker.txt');
	fs.writeFileSync(markerPath, 'ui-test\n', 'utf8');

	await VSBrowser.instance.openResources(workspaceRoot, async () => {
		await VSBrowser.instance.waitForWorkbench(60_000, dismissBlockingOverlays);
	});

	return workspaceRoot;
}

async function getCommandPaletteLabels(input: InputBox): Promise<string[]> {
	const picks = await input.getQuickPicks();
	const labels: string[] = [];
	for (const pick of picks) {
		labels.push(await pick.getLabel());
	}
	return labels;
}

describe('Open iTerm2 command palette UI', function () {
	let workspaceRoot: string;

	before(async function () {
		if (process.platform !== 'darwin') {
			this.skip();
		}
		this.timeout(180_000);
		workspaceRoot = await openWorkspace();
	});

	after(async function () {
		if (workspaceRoot && fs.existsSync(workspaceRoot)) {
			fs.rmSync(workspaceRoot, { recursive: true, force: true });
		}
	});

	it('shows Open iTerm2 in the command palette and executes without error', async function () {
		this.timeout(120_000);
		await dismissBlockingOverlays();

		const workbench = new Workbench();
		const input = (await workbench.openCommandPrompt()) as InputBox;
		await input.setText(COMMAND_SEARCH);
		await VSBrowser.instance.driver.sleep(1_000);

		const labels = await getCommandPaletteLabels(input);
		expect(labels, `command palette labels while searching "${COMMAND_SEARCH}"`).to.include(COMMAND_LABEL);

		await input.selectQuickPick(COMMAND_LABEL);
		await VSBrowser.instance.driver.sleep(500);
		await dismissBlockingOverlays();
	});
});