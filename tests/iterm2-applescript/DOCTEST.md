# iTerm2 AppleScript Tests

Doc-style tests focused on iTerm2 AppleScript generation and live `osascript` compatibility.

Command routing, palette behavior, and shortcut preference tests remain in `tests/open-iterm2/`.

## Version

0.0.1

## DSN (Domain Specific Notion)

### Participants
- **iTerm2 module** — `src/iterm2.ts`; builds AppleScript and launches via `osascript`.
- **Node harness** — `testdata/harness/run.mjs` loads compiled `out/iterm2.js`.

### Behaviors
- **`buildOpenITerm2Script`** — scans session paths with `tell aSession`, opens a tab in a matching window, otherwise creates a new window.
- **`buildPathScanSmokeScript`** — minimal live-safe script that only probes session path access.
- **Live scan smoke** — runs the smoke script with real `osascript` when iTerm2 is installed.

## Decision Tree

```
scenario
├── script/
│   ├── smart-open-branches
│   ├── uses-tell-session-access
│   └── uses-on-error-handler
└── live/
    └── scan-smoke
```

## Test Index

| # | Path | Description |
|---|------|-------------|
| 1 | `script/smart-open-branches/` | Smart open script has tab reuse and window fallback |
| 2 | `script/uses-tell-session-access/` | Reads `path` via `tell aSession`, not `of aSession` |
| 3 | `script/uses-on-error-handler/` | Path probe is wrapped in `on error` |
| 4 | `live/scan-smoke/` | Real `osascript` path scan exits successfully |

## How to Run

```sh
npm run compile
doctest test ./tests/iterm2-applescript
npm test
```

```go
import (
	"bytes"
	"encoding/json"
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

var activeGroup string

type Request struct {
	Scenario string `json:"scenario"`
	TestPath string `json:"testPath"`
}

type Response struct {
	Script                 string `json:"script"`
	UsesCreateWindow       bool   `json:"usesCreateWindow"`
	UsesCreateTab          bool   `json:"usesCreateTab"`
	UsesPathScan           bool   `json:"usesPathScan"`
	UsesTellSessionAccess  bool   `json:"usesTellSessionAccess"`
	UsesInvalidPathAccess  bool   `json:"usesInvalidPathAccess"`
	UsesOnErrorHandler     bool   `json:"usesOnErrorHandler"`
	Skipped                bool   `json:"skipped"`
	SkipReason             string `json:"skipReason"`
	Ok                     bool   `json:"ok"`
	Stdout                 string `json:"stdout"`
	Error                  string `json:"error"`
}

func Run(t *testing.T, req *Request) (*Response, error) {
	_ = activeGroup
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
```