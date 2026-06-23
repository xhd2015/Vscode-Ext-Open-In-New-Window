import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { expect } from 'chai';
import {
	ActivityBar,
	By,
	ContextMenu,
	DefaultTreeSection,
	Key,
	SideBarView,
	VSBrowser,
} from 'vscode-extension-tester';

const GIT_MENU_LABEL = 'Git: Open Repository';
const OPEN_MENU_LABEL = 'Open in New Window';
const SCAN_POLL_MS = 1_000;
const SCAN_TIMEOUT_MS = 90_000;

async function dismissBlockingOverlays(): Promise<void> {
	const driver = VSBrowser.instance.driver;

	for (let attempt = 0; attempt < 4; attempt++) {
		await driver.actions().sendKeys(Key.ESCAPE).perform();
		await driver.sleep(250);
	}

	const selectors = [
		'.onboarding-a-overlay.visible [aria-label="Close"]',
		'.onboarding-a-overlay.visible .codicon-close',
		'.monaco-dialog-modal-message .monaco-dialog-buttons .monaco-button',
		'.gettingStartedContainer .codicon-close',
	];

	for (const selector of selectors) {
		try {
			const buttons = await driver.findElements(By.css(selector));
			for (const button of buttons) {
				if (await button.isDisplayed()) {
					await button.click();
					await driver.sleep(300);
				}
			}
		} catch {
			// Overlay may disappear between find and click.
		}
	}
}

async function openExplorerView(): Promise<void> {
	const driver = VSBrowser.instance.driver;
	const deadline = Date.now() + 60_000;

	while (Date.now() < deadline) {
		await dismissBlockingOverlays();
		try {
			const explorer = await new ActivityBar().getViewControl('Explorer');
			if (explorer) {
				await explorer.openView();
				await driver.sleep(500);
				return;
			}
		} catch {
			// Retry when onboarding overlay intercepts the click.
		}
		await driver.sleep(500);
	}

	throw new Error('Failed to open Explorer view within 60s');
}

async function openGitRepoWorkspace(): Promise<string> {
	const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'open-in-new-window-ui-'));
	const nestedRepoPath = path.join(workspaceRoot, 'x');
	const plainFolderPath = path.join(workspaceRoot, 'plain');

	fs.mkdirSync(nestedRepoPath, { recursive: true });
	fs.mkdirSync(plainFolderPath, { recursive: true });
	execSync('git init -q', { cwd: workspaceRoot });
	execSync('git init -q', { cwd: nestedRepoPath });

	await VSBrowser.instance.openResources(workspaceRoot, async () => {
		await VSBrowser.instance.waitForWorkbench(60_000, dismissBlockingOverlays);
	});

	await openExplorerView();
	return workspaceRoot;
}

async function getExplorerTree(workspaceRoot: string): Promise<DefaultTreeSection> {
	const sectionName = path.basename(workspaceRoot);
	const view = new SideBarView();
	const content = view.getContent();
	return (await content.getSection(sectionName)) as DefaultTreeSection;
}

async function openExplorerContextMenu(
	folderLabel: string,
	tree: DefaultTreeSection,
): Promise<ContextMenu> {
	const item = await tree.findItem(folderLabel);
	expect(item, `explorer item "${folderLabel}"`).to.not.equal(undefined);
	return item!.openContextMenu();
}

async function getContextMenuLabels(menu: ContextMenu): Promise<string[]> {
	const items = await menu.getItems();
	const labels: string[] = [];
	for (const item of items) {
		labels.push(await item.getLabel());
	}
	return labels;
}

async function waitForGitMenuOnFolder(
	workspaceRoot: string,
	folderLabel: string,
): Promise<ContextMenu> {
	const deadline = Date.now() + SCAN_TIMEOUT_MS;
	let lastLabels: string[] = [];

	while (Date.now() < deadline) {
		await dismissBlockingOverlays();
		const tree = await getExplorerTree(workspaceRoot);
		const menu = await openExplorerContextMenu(folderLabel, tree);
		lastLabels = await getContextMenuLabels(menu);

		if (!lastLabels.includes(OPEN_MENU_LABEL)) {
			throw new Error(
				`Extension menu "${OPEN_MENU_LABEL}" missing; labels=${lastLabels.join(', ')}`,
			);
		}
		if (lastLabels.includes(GIT_MENU_LABEL)) {
			return menu;
		}
		await menu.close();
		await VSBrowser.instance.driver.sleep(SCAN_POLL_MS);
	}

	throw new Error(
		`"${GIT_MENU_LABEL}" not visible for folder "${folderLabel}" within ${SCAN_TIMEOUT_MS}ms; `
			+ `last menu labels=${lastLabels.join(', ')}`,
	);
}

describe('Git context menu UI', () => {
	let workspaceRoot: string;

	before(async function () {
		this.timeout(180_000);
		workspaceRoot = await openGitRepoWorkspace();
	});

	after(async function () {
		if (workspaceRoot && fs.existsSync(workspaceRoot)) {
			fs.rmSync(workspaceRoot, { recursive: true, force: true });
		}
	});

	it('shows Git: Open Repository on nested git folder', async function () {
		this.timeout(120_000);
		const menu = await waitForGitMenuOnFolder(workspaceRoot, 'x');
		expect(await menu.hasItem(GIT_MENU_LABEL)).to.be.true;
		await menu.close();
	});

	it('hides Git: Open Repository on non-git folder', async function () {
		this.timeout(60_000);
		await dismissBlockingOverlays();
		const tree = await getExplorerTree(workspaceRoot);
		const menu = await openExplorerContextMenu('plain', tree);
		expect(await menu.hasItem(GIT_MENU_LABEL)).to.be.false;
		await menu.close();
	});
});