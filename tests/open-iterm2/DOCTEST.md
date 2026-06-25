# Open iTerm2 Tests

Doc-style tests for the **Open iTerm2** command palette action, Cmd+; shortcut
routing, and Switch Shortcut preference storage.

## Version

0.0.2

## DSN (Domain Specific Notion)

### Participants
- **Extension** — `src/extension.ts`; registers palette, shortcut, grok, and
  switch commands; reads/writes shortcut preference in `globalState`.
- **iTerm2 actions** — `src/iterm2-actions.ts`; defines cd-only and grok actions.
- **iTerm2 module** — `src/iterm2.ts`; resolves directory, builds AppleScript, launches via `osascript`.
- **Node harness** — `testdata/harness/run.mjs` loads compiled extension with mocked `vscode`.
- **ExTester UI** — verifies command palette visibility and Switch Shortcut action picker on macOS.

### Behaviors
- **Palette Open iTerm2** — always cd-only, independent of stored Cmd+; preference.
- **Cmd+; shortcut** — runs stored preference (default cd-only).
- **Palette Open iTerm2: Grok** — always runs grok.
- **Switch Shortcut** — persists preference and shows confirmation message.
- **`resolveTargetDirectory`** — first workspace folder, else home directory.
- **`buildOpenITerm2Script`** — new window (not tab) with `cd` and optional follow-up commands.
- **`openInITerm2`** — checks iTerm2 install, launches or surfaces errors.

## Decision Tree

```
scenario
├── path-resolution/
│   ├── workspace-first-folder
│   ├── no-workspace-uses-home
│   └── multi-root-uses-first
├── path-escaping/
│   ├── spaces
│   └── single-quote
├── launch/
│   ├── builds-new-window-script
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
│   │   ├── with-cd-only-shortcut
│   │   ├── default-no-stored
│   │   └── with-unknown-shortcut
│   ├── grok-command/
│   │   ├── ignores-cd-only-shortcut
│   │   └── ignores-grok-shortcut
│   ├── switch-then-execute/
│   │   ├── switch-to-grok-both-actions
│   │   └── switch-back-both-actions
│   └── switch-shortcut/
│       ├── persists-grok
│       └── persists-cd-only
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
| 4 | `path-escaping/spaces/` | Escapes paths with spaces |
| 5 | `path-escaping/single-quote/` | Escapes paths with single quotes |
| 6 | `launch/builds-new-window-script/` | Script creates window, not tab |
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
| 23 | `ui/command-palette-visible/` | Command appears in palette (ExTester) |
| 24 | `ui/switch-shortcut-action-picker/` | Switch Shortcut shows action items (ExTester) |

## How to Run

```sh
npm run compile
doctest test ./tests/open-iterm2
npm test
npm run ui-test
```

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