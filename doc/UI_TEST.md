# UI Test Gotchas (ExTester)

Notes from building and debugging UI tests for this extension with [vscode-extension-tester](https://github.com/redhat-developer/vscode-extension-tester) (ExTester).

## Isolated extensions directory

**Problem:** By default, ExTester launches VS Code with your normal `~/.vscode/extensions`. Claude Code, GitLens, and other extensions activate on every workspace open, steal focus, and make tests flaky.

**Fix:** All `ui-test:*` npm scripts pass `--extensions_dir .test-extensions`. Only the packaged `open-in-new-window` VSIX is installed there.

```bash
npm run ui-test:switch-iterm2-shortcut
# uses --extensions_dir .test-extensions
```

The directory is gitignored (`.test-extensions/`).

## Command palette search

**Problem:** Typing a title like `Switch Shortcut` without the `>` prefix searches files, settings, and symbols — often showing **No matching results** even when the command exists.

**Fix:** Search in **command mode** using the command ID:

```
>open-in-new-window.switchITerm2Shortcut
```

Helpers in `src/ui-test/ui-test-helpers.ts` prepend `>` automatically via `toCommandPaletteSearch()`.

## `when: "isMac"` on command palette entries

**Problem:** `contributes.menus.commandPalette` entries with `when: "isMac"` did not appear in the ExTester VS Code instance during UI tests (even on macOS).

**Fix:** Removed `when: "isMac"` from command palette contributions for iTerm2 commands. Runtime code still checks `process.platform === 'darwin'` before launching iTerm2. Keybindings still use `when: "isMac"`.

## Opening the palette without typing

**Problem:** An early helper called `dismissBlockingOverlays()` (Escape × 4) in a retry loop *after* opening the palette, or searched with `>` alone and then called `cancel()` — the palette opened, nothing useful was entered, and it closed.

**Fix:**

1. `dismissBlockingOverlays()` only **before** opening the palette.
2. `input.clear()` then `input.setText(search)`.
3. Do not Escape-dismiss while the palette should stay open.

## Retry budget

**Problem:** A 90-second poll loop retried hundreds of times, reopening the palette and looking like a runaway test.

**Fix:** **3 attempts**, 2 seconds apart (`COMMAND_PALETTE_MAX_ATTEMPTS`, `COMMAND_PALETTE_RETRY_DELAY_MS` in `ui-test-helpers.ts`).

## Workspace activation

**Problem:** Opening a single file path did not give a stable editor/command-palette focus.

**Fix:** `openWorkspace()` opens the **workspace folder** (not only a file) and waits **2 seconds** (`EXTENSION_READY_DELAY_MS`) after the workbench loads so `onStartupFinished` activation can finish.

## Action picker (Switch Shortcut)

After selecting **Switch Shortcut**, a second quick pick lists actions (`Open iTerm2`, `Open iTerm2: Grok`). `waitForActionPickerItems()` polls `InputBox.create()` up to 3 times — same retry limits as the command palette helper.

## Platform and prerequisites

| Requirement | Detail |
|-------------|--------|
| OS | macOS only — tests call `this.skip()` on other platforms |
| Setup | `npm run ui-test:setup` downloads VS Code + chromedriver |
| Short mode | Doctest UI scenarios skip when `testing.Short()` |

## Running UI tests

```bash
# Single scenario
npm run ui-test:switch-iterm2-shortcut
npm run ui-test:open-iterm2

# All UI tests
npm run ui-test

# Via doctest (includes UI leaves under tests/open-iterm2/ui/)
doctest test ./tests/open-iterm2
doctest test ./tests/...
```

## Doctest UI leaves

| Path | npm script | Scenario ID |
|------|------------|-------------|
| `tests/open-iterm2/ui/command-palette-visible/` | `ui-test:open-iterm2` | `ui-command-palette-visible` |
| `tests/open-iterm2/ui/switch-shortcut-action-picker/` | `ui-test:switch-iterm2-shortcut` | `ui-switch-shortcut-action-picker` |

## Source layout

```
src/ui-test/
  ui-test-helpers.ts          # shared palette/workspace helpers
  open-iterm2.test.ts
  switch-iterm2-shortcut.test.ts
  git-context-menu.test.ts
ui-test/settings.json         # merged into ExTester VS Code settings
.mocharc.ui-test.js           # 120s mocha timeout
```