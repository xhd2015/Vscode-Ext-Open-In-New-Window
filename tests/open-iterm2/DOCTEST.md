# Open iTerm2 Tests

Doc-style tests for the **Open iTerm2** command palette action, Cmd+; shortcut
routing, and Switch Shortcut preference storage.

## Version

0.0.2

## DSN (Domain Specific Notion)

### Participants
- **Extension** — `src/extension.ts`; registers palette, shortcut, dedicated
  AI CLI commands (Grok, Codex, Claude Code, OpenCode, Pi), and Switch Shortcut;
  reads/writes shortcut preference in `globalState`.
- **iTerm2 actions** — `src/iterm2-actions.ts`; defines cd-only and follow-up
  CLI actions (`grok`, `codex`, `claude`, `opencode`, `pi`).
- **iTerm2 module** — `src/iterm2.ts`; resolves directory, builds AppleScript, launches via `osascript`.
- **Node harness** — `testdata/harness/run.mjs` loads compiled extension with mocked `vscode`.
- **ExTester UI** — verifies command palette visibility and Switch Shortcut action picker on macOS.

### Behaviors
- **Palette Open iTerm2** — always cd-only, independent of stored Cmd+; preference.
- **Cmd+; shortcut** — runs stored action (default cd-only), including follow-up
  CLIs for grok, codex, claude, opencode, or pi when selected via Switch Shortcut.
- **Palette Open iTerm2: Grok** — always runs `grok`.
- **Palette Open iTerm2: Codex / Claude Code / OpenCode / Pi** — always run the
  matching CLI (`codex`, `claude`, `opencode`, `pi`), ignoring stored Cmd+; preference.
- **Switch Shortcut** — persists preference and shows confirmation message.
- **`resolveTargetDirectory`** — first workspace folder, else home directory.
- **`buildOpenITerm2Script`** — AppleScript details are covered in `tests/iterm2-applescript/`.
- **`normalizeTargetDirectory`** — resolves existing paths to their canonical form before matching.
- **`openInITerm2`** — checks iTerm2 install, launches or surfaces errors.

## Decision Tree

```
scenario
├── path-resolution/
│   ├── workspace-first-folder
│   ├── no-workspace-uses-home
│   ├── multi-root-uses-first
│   └── normalize-existing-path
├── path-escaping/
│   ├── spaces
│   └── single-quote
├── launch/
│   └── invokes-osascript
├── error/
│   ├── iterm-not-installed
│   └── osascript-failure
├── command-routing/
│   ├── palette/
│   │   ├── with-grok-shortcut
│   │   ├── with-cd-only-shortcut
│   │   └── with-unknown-shortcut
│   ├── shortcut/
│   │   ├── with-grok-shortcut
│   │   ├── with-codex-shortcut
│   │   ├── with-claude-shortcut
│   │   ├── with-opencode-shortcut
│   │   ├── with-pi-shortcut
│   │   ├── with-cd-only-shortcut
│   │   ├── default-no-stored
│   │   └── with-unknown-shortcut
│   ├── grok-command/
│   │   ├── ignores-cd-only-shortcut
│   │   └── ignores-grok-shortcut
│   ├── codex-command/
│   │   ├── ignores-cd-only-shortcut
│   │   └── ignores-own-shortcut
│   ├── claude-command/
│   │   ├── ignores-cd-only-shortcut
│   │   └── ignores-own-shortcut
│   ├── opencode-command/
│   │   ├── ignores-cd-only-shortcut
│   │   └── ignores-own-shortcut
│   ├── pi-command/
│   │   ├── ignores-cd-only-shortcut
│   │   └── ignores-own-shortcut
│   ├── switch-then-execute/
│   │   ├── switch-to-grok-both-actions
│   │   ├── switch-back-both-actions
│   │   ├── switch-to-codex-both-actions
│   │   └── switch-back-from-codex
│   └── switch-shortcut/
│       ├── persists-grok
│       ├── persists-cd-only
│       ├── persists-codex
│       ├── persists-claude
│       ├── persists-opencode
│       └── persists-pi
└── ui/
    ├── command-palette-visible
    └── switch-shortcut-action-picker
```

## Test Index

| # | Path | Description |
|---|------|-------------|
| 1 | `path-resolution/workspace-first-folder/` | Uses first workspace folder |
| 2 | `path-resolution/no-workspace-uses-home/` | Falls back to home directory |
| 3 | `path-resolution/multi-root-uses-first/` | Multi-root uses first folder |
| 4 | `path-resolution/normalize-existing-path/` | Normalizes existing paths before matching |
| 5 | `path-escaping/spaces/` | Escapes paths with spaces |
| 6 | `path-escaping/single-quote/` | Escapes paths with single quotes |
| 7 | `launch/invokes-osascript/` | Calls `osascript` with built script |
| 8 | `error/iterm-not-installed/` | Error when iTerm2.app missing |
| 9 | `error/osascript-failure/` | Error when osascript fails |
| 10 | `command-routing/palette/with-grok-shortcut/` | Palette cd-only when shortcut is Grok |
| 11 | `command-routing/palette/with-cd-only-shortcut/` | Palette cd-only when shortcut is cd-only |
| 12 | `command-routing/palette/with-unknown-shortcut/` | Palette cd-only with invalid stored shortcut |
| 13 | `command-routing/shortcut/with-grok-shortcut/` | Shortcut runs Grok when preference is Grok |
| 14 | `command-routing/shortcut/with-cd-only-shortcut/` | Shortcut cd-only when preference is cd-only |
| 15 | `command-routing/shortcut/default-no-stored/` | Shortcut defaults to cd-only |
| 16 | `command-routing/shortcut/with-unknown-shortcut/` | Shortcut falls back to cd-only |
| 17 | `command-routing/grok-command/ignores-cd-only-shortcut/` | Grok command always runs grok |
| 18 | `command-routing/grok-command/ignores-grok-shortcut/` | Grok command runs grok when shortcut is grok |
| 19 | `command-routing/switch-then-execute/switch-to-grok-both-actions/` | Switch to Grok then both commands correct |
| 20 | `command-routing/switch-then-execute/switch-back-both-actions/` | Switch back then both commands correct |
| 21 | `command-routing/switch-shortcut/persists-grok/` | Switch Shortcut persists grok |
| 22 | `command-routing/switch-shortcut/persists-cd-only/` | Switch Shortcut persists cd-only |
| 23 | `command-routing/codex-command/ignores-cd-only-shortcut/` | Codex command runs codex when shortcut is cd-only |
| 24 | `command-routing/codex-command/ignores-own-shortcut/` | Codex command runs codex when shortcut is codex |
| 25 | `command-routing/claude-command/ignores-cd-only-shortcut/` | Claude command runs claude when shortcut is cd-only |
| 26 | `command-routing/claude-command/ignores-own-shortcut/` | Claude command runs claude when shortcut is claude |
| 27 | `command-routing/opencode-command/ignores-cd-only-shortcut/` | OpenCode command runs opencode when shortcut is cd-only |
| 28 | `command-routing/opencode-command/ignores-own-shortcut/` | OpenCode command runs opencode when shortcut is opencode |
| 29 | `command-routing/pi-command/ignores-cd-only-shortcut/` | Pi command runs pi when shortcut is cd-only |
| 30 | `command-routing/pi-command/ignores-own-shortcut/` | Pi command runs pi when shortcut is pi |
| 31 | `command-routing/shortcut/with-codex-shortcut/` | Shortcut runs codex when preference is codex |
| 32 | `command-routing/shortcut/with-claude-shortcut/` | Shortcut runs claude when preference is claude |
| 33 | `command-routing/shortcut/with-opencode-shortcut/` | Shortcut runs opencode when preference is opencode |
| 34 | `command-routing/shortcut/with-pi-shortcut/` | Shortcut runs pi when preference is pi |
| 35 | `command-routing/switch-shortcut/persists-codex/` | Switch Shortcut persists codex |
| 36 | `command-routing/switch-shortcut/persists-claude/` | Switch Shortcut persists claude |
| 37 | `command-routing/switch-shortcut/persists-opencode/` | Switch Shortcut persists opencode |
| 38 | `command-routing/switch-shortcut/persists-pi/` | Switch Shortcut persists pi |
| 39 | `command-routing/switch-then-execute/switch-to-codex-both-actions/` | Switch to Codex then palette/shortcut behave correctly |
| 40 | `command-routing/switch-then-execute/switch-back-from-codex/` | Switch back from Codex then both actions cd-only |
| 41 | `ui/command-palette-visible/` | Command appears in palette (ExTester) |
| 42 | `ui/switch-shortcut-action-picker/` | Switch Shortcut shows all six action items (ExTester) |

AppleScript generation and live `osascript` smoke tests live in `tests/iterm2-applescript/`.

## How to Run

```sh
npm run compile
doctest test ./tests/open-iterm2              # skips ui-automation leaves in discovery
npm run ui-test:open-iterm2                  # command-palette-visible leaf
npm run ui-test:switch-iterm2-shortcut       # switch-shortcut-action-picker leaf
npm test
npm run ui-test                               # all ExTester UI tests (macOS + chromedriver)
```

Leaves under `ui/` carry `label: ui-automation` and are skipped during discovery
runs (including `doctest test ./tests/open-iterm2`). Run them via the matching
`npm run ui-test:*` script after `npm run ui-test:setup`.

```go
import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

var activeGroup string

type WorkflowStep struct {
	Type      string `json:"type"`
	ActionId  string `json:"actionId"`
	CommandId string `json:"commandId"`
}

type Request struct {
	Scenario             string         `json:"scenario"`
	WorkspaceFolders     []string       `json:"workspaceFolders"`
	Homedir              string         `json:"homedir"`
	TestPath             string         `json:"testPath"`
	PathExists           bool           `json:"pathExists"`
	RealPath             string         `json:"realPath"`
	ExistsITerm          bool           `json:"existsITerm"`
	ExecFileError        string         `json:"execFileError"`
	Platform             string         `json:"platform"`
	SkipLaunch           bool           `json:"skipLaunch"`
	ShortcutActionId     string         `json:"shortcutActionId"`
	OmitShortcutActionId bool           `json:"omitShortcutActionId"`
	FollowUpCommands     []string       `json:"followUpCommands"`
	CommandId            string         `json:"commandId"`
	Steps                []WorkflowStep `json:"steps"`
}

type ExecutionResult struct {
	CommandId        string   `json:"commandId"`
	FollowUpCommands []string `json:"followUpCommands"`
	Script           string   `json:"script"`
	Ok               bool     `json:"ok"`
}

type Response struct {
	TargetDir              string            `json:"targetDir"`
	Script                 string            `json:"script"`
	EscapedPath            string            `json:"escapedPath"`
	UsesCreateWindow       bool              `json:"usesCreateWindow"`
	UsesCreateTab          bool              `json:"usesCreateTab"`
	UsesPathScan           bool              `json:"usesPathScan"`
	Ok                     bool              `json:"ok"`
	Error                  string            `json:"error"`
	ExecFileCalled         bool              `json:"execFileCalled"`
	ExecFileCommand        string            `json:"execFileCommand"`
	ExecFileArgv            []string          `json:"execFileArgv"`
	ErrorMessage           string            `json:"errorMessage"`
	ExitCode               int               `json:"exitCode"`
	Output                 string            `json:"output"`
	FollowUpCommands       []string          `json:"followUpCommands"`
	Executions             []ExecutionResult `json:"executions"`
	StoredShortcutActionId string            `json:"storedShortcutActionId"`
	InformationMessage     string            `json:"informationMessage"`
}

func Run(t *testing.T, req *Request) (*Response, error) {
	_ = activeGroup
	if req.Scenario == "ui-command-palette-visible" || req.Scenario == "ui-switch-shortcut-action-picker" {
		return runUiTest(t, req.Scenario)
	}
	harness := filepath.Join(DOCTEST_ROOT, "testdata", "harness", "run.mjs")
	payload, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}
	cmd := exec.Command("node", harness, string(payload))
	cmd.Dir = filepath.Join(DOCTEST_ROOT, "..", "..")
	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("%w\n%s", err, stderr.String())
	}
	out := stdout.Bytes()
	var resp Response
	if err := json.Unmarshal(out, &resp); err != nil {
		t.Fatalf("invalid harness output: %v\nstdout=%s\nstderr=%s", err, out, stderr.String())
	}
	return &resp, nil
}

func runUiTest(t *testing.T, scenario string) (*Response, error) {
	if testing.Short() {
		t.Skip("ui-test skipped in short mode")
	}
	chromedriver := filepath.Join(os.TempDir(), "test-resources", "chromedriver-mac-arm64", "chromedriver")
	if _, err := os.Stat(chromedriver); err != nil {
		t.Skip("chromedriver not installed; run npm run ui-test:setup")
	}
	npmScript := map[string]string{
		"ui-command-palette-visible":       "ui-test:open-iterm2",
		"ui-switch-shortcut-action-picker": "ui-test:switch-iterm2-shortcut",
	}[scenario]
	if npmScript == "" {
		t.Fatalf("unknown ui scenario: %s", scenario)
	}
	projectRoot := filepath.Join(DOCTEST_ROOT, "..", "..")
	cmd := exec.Command("npm", "run", npmScript)
	cmd.Dir = projectRoot
	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err := cmd.Run()
	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			return nil, err
		}
	}
	return &Response{
		ExitCode: exitCode,
		Output:   stdout.String() + stderr.String(),
	}, nil
}
```