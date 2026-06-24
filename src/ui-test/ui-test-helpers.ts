import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
	InputBox,
	Key,
	VSBrowser,
	Workbench,
} from 'vscode-extension-tester';

const EXTENSION_READY_DELAY_MS = 2_000;
const COMMAND_PALETTE_MAX_ATTEMPTS = 3;
const COMMAND_PALETTE_RETRY_DELAY_MS = 2_000;

export async function openWorkspace(prefix: string): Promise<string> {
	const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
	const markerPath = path.join(workspaceRoot, 'marker.txt');
	fs.writeFileSync(markerPath, 'ui-test\n', 'utf8');

	await VSBrowser.instance.openResources(workspaceRoot, async () => {
		await VSBrowser.instance.waitForWorkbench(60_000, dismissBlockingOverlays);
	});
	await VSBrowser.instance.driver.sleep(EXTENSION_READY_DELAY_MS);

	return workspaceRoot;
}

export async function dismissBlockingOverlays(): Promise<void> {
	const driver = VSBrowser.instance.driver;
	for (let attempt = 0; attempt < 4; attempt++) {
		await driver.actions().sendKeys(Key.ESCAPE).perform();
		await driver.sleep(250);
	}
}

export async function getQuickPickLabels(input: InputBox): Promise<string[]> {
	const picks = await input.getQuickPicks();
	const labels: string[] = [];
	for (const pick of picks) {
		labels.push(await pick.getLabel());
	}
	return labels;
}

function toCommandPaletteSearch(searchText: string): string {
	return searchText.startsWith('>') ? searchText : `>${searchText}`;
}

async function openCommandPaletteSearch(searchText: string): Promise<InputBox> {
	const workbench = new Workbench();
	const input = (await workbench.openCommandPrompt()) as InputBox;
	await input.clear();
	await input.setText(toCommandPaletteSearch(searchText));
	await VSBrowser.instance.driver.sleep(1_000);
	return input;
}

export async function waitForCommandPaletteLabel(
	searchText: string,
	labelMatcher: (label: string) => boolean,
	maxAttempts = COMMAND_PALETTE_MAX_ATTEMPTS,
): Promise<{ input: InputBox; label: string }> {
	let lastLabels: string[] = [];

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		await dismissBlockingOverlays();

		try {
			const input = await openCommandPaletteSearch(searchText);
			lastLabels = await getQuickPickLabels(input);
			const label = lastLabels.find(labelMatcher);
			if (label) {
				return { input, label };
			}

			await input.cancel();
		} catch {
			// command palette not ready yet
		}

		if (attempt < maxAttempts) {
			await VSBrowser.instance.driver.sleep(COMMAND_PALETTE_RETRY_DELAY_MS);
		}
	}

	throw new Error(
		`Matching command not found for "${searchText}" after ${maxAttempts} attempts. `
			+ `Last labels: ${JSON.stringify(lastLabels)}`,
	);
}

export async function waitForActionPickerItems(
	expectedLabels: readonly string[],
	maxAttempts = COMMAND_PALETTE_MAX_ATTEMPTS,
): Promise<InputBox> {
	let lastLabels: string[] = [];

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const picker = await InputBox.create(3_000);
			lastLabels = await getQuickPickLabels(picker);
			if (expectedLabels.every((label) => lastLabels.includes(label))) {
				return picker;
			}
		} catch {
			// picker not visible yet
		}

		if (attempt < maxAttempts) {
			await VSBrowser.instance.driver.sleep(COMMAND_PALETTE_RETRY_DELAY_MS);
		}
	}

	throw new Error(
		`Action picker items not found after ${maxAttempts} attempts. `
			+ `Last labels: ${JSON.stringify(lastLabels)}`,
	);
}