# IPC CLI / URI Handler Tests

Doc-style tests for the extension IPC v2 protocol and `/open` URI handler that
serve the kool CLI (`kool vscode open`, `kool vscode open-git-repo`).

## Version

0.0.2

## DSN (Domain Specific Notion)

### Participants
- **kool CLI** — connects to `~/.kool/xhd2015.open-in-new-window.sock`, sends
  JSON-line requests; falls back to `vscode://` URIs when IPC is unreachable.
  Optional `replace` flag propagates to IPC JSON and URI query.
- **IPC server v2** — Unix socket (named pipe on Windows) owned by one VS Code
  window via a lease file; owner renews every 2s (5s TTL); non-owners rebind
  when lease is stale or owner PID is dead.
- **Extension** — `src/extension.ts`; starts IPC on activate, handles requests,
  registers URI handlers for `/open` and `/git-open`.
- **`open` handler** — normalizes path, calls
  `vscode.openFolder(uri, { forceNewWindow })` where `forceNewWindow` is derived
  from the `replace` parameter.
- **`replace` parameter** — when absent or false (default), opens in a new window
  (`forceNewWindow: true`); VS Code focuses if the directory is already open.
  When true (`--replace`), reuses the current window (`forceNewWindow: false`).
- **`git-open` handler** — reuses `openGitRepositoryAtPath` → `git.openRepository`.
- **Node harness** — `testdata/harness/run.mjs` loads compiled `out/extension.js`
  with a mocked `vscode` module and invokes exported test hooks.
- **Lease files** — `~/.kool/xhd2015.open-in-new-window.sock` and
  `xhd2015.open-in-new-window.lease.json` (`{pid, windowId, socketPath, expiresAt}`).

### Behaviors
- **IPC ping** — `{"op":"ping"}` → `{"ok":true,"version":"..."}`.
- **IPC open default** — valid directory, no `replace` → `openFolder` with
  `forceNewWindow: true` (new window; focus if already open).
- **IPC open replace** — `{"op":"open","path":"...","replace":true}` →
  `openFolder` with `forceNewWindow: false` (replace current window).
- **IPC open focus** — directory already in a workspace window → `openFolder`
  still invoked; default path uses `forceNewWindow: true`, VS Code focuses.
- **IPC open failure** — missing path, non-directory, or nonexistent path → error response.
- **IPC git-open success** — valid git repo → `git.openRepository(normalizedPath)`.
- **IPC git-open failure** — no `.git` silent skip; not-directory surfaces error.
- **IPC invalid op** — unknown `op` → `{"ok":false,"error":"..."}`.
- **URI /open default** — cold-start fallback; `openFolder` with `forceNewWindow: true`.
- **URI /open replace** — `?replace=true` → `openFolder` with `forceNewWindow: false`.
- **URI /git-open** — covered in `tests/git-open-cli/`; must remain compatible.

## Decision Tree

```
channel
├── ipc/
│   ├── ping/
│   │   └── success/                    → ok + version
│   ├── open/
│   │   ├── success/
│   │   │   ├── valid-dir/              → default: openFolder(forceNewWindow: true)
│   │   │   ├── trailing-slash/         → path normalized; forceNewWindow: true
│   │   │   ├── focus-existing/         → default: focus existing folder
│   │   │   └── replace/                → replace:true → forceNewWindow: false
│   │   └── failure/
│   │       ├── not-directory/
│   │       ├── missing-path/
│   │       └── nonexistent-path/
│   ├── git-open/
│   │   ├── success/
│   │   │   └── valid-repo/
│   │   └── failure/
│   │       ├── no-git/                 → silent skip
│   │       └── not-directory/
│   └── invalid/
│       └── unknown-op/
└── uri/
    └── open/
        ├── success/
        │   ├── open-fallback/            → default: forceNewWindow: true
        │   ├── focus-existing/           → default: focus existing folder
        │   └── replace-fallback/         → ?replace=true → forceNewWindow: false
        └── failure/
            ├── not-directory/
            ├── missing-path-query/
            └── empty-path-query/
```

## Test Index

| # | Path | Description |
|---|------|-------------|
| 1 | `ipc/ping/success/` | Ping returns ok and version |
| 2 | `ipc/open/success/valid-dir/` | Default open uses `forceNewWindow: true` |
| 3 | `ipc/open/success/trailing-slash/` | Trailing slash stripped; default new window |
| 4 | `ipc/open/success/focus-existing/` | Existing folder focused (default path) |
| 5 | `ipc/open/success/replace/` | `replace:true` uses `forceNewWindow: false` |
| 6 | `ipc/open/failure/not-directory/` | File path returns error |
| 7 | `ipc/open/failure/missing-path/` | Missing path returns error |
| 8 | `ipc/open/failure/nonexistent-path/` | Nonexistent path returns error |
| 9 | `ipc/git-open/success/valid-repo/` | Opens valid git repo via IPC |
| 10 | `ipc/git-open/failure/no-git/` | Directory without .git silently skipped |
| 11 | `ipc/git-open/failure/not-directory/` | Non-directory returns error |
| 12 | `ipc/invalid/unknown-op/` | Unknown op returns error |
| 13 | `uri/open/success/open-fallback/` | Default `/open` URI uses `forceNewWindow: true` |
| 14 | `uri/open/success/focus-existing/` | `/open` URI focuses existing folder |
| 15 | `uri/open/success/replace-fallback/` | `?replace=true` uses `forceNewWindow: false` |
| 16 | `uri/open/failure/not-directory/` | `/open` URI rejects file path |
| 17 | `uri/open/failure/missing-path-query/` | Missing `path` query surfaces error |
| 18 | `uri/open/failure/empty-path-query/` | Empty `path` query surfaces error |

Lease bind, transfer, and stale-PID behavior are covered in `tests/ipc-lifecycle/`.
kool CLI orchestration (precheck, retry, URI fallback) is covered in `kool/tests/vscode/open/`.

## How to Run

```sh
npm run compile
doctest vet ./tests/ipc-cli
doctest test ./tests/ipc-cli
```

Required test exports from `src/extension.ts`:
- `TestExported_ipcHandleRequest(requestJSON string) (string, error)`
- `TestExported_handleOpenUri(uriString string) (OpenResult, error)`

```go
import (
	"bytes"
	"encoding/json"
	"fmt"
	"os/exec"
	"path/filepath"
	"testing"
)

type Request struct {
	Scenario string `json:"scenario"`
}

type Response struct {
	OK                       bool   `json:"ok"`
	Version                  string `json:"version,omitempty"`
	Error                    string `json:"error,omitempty"`
	OpenFolderCalled         bool   `json:"openFolderCalled"`
	OpenFolderPath           string `json:"openFolderPath"`
	OpenFolderForceNewWindow bool   `json:"openFolderForceNewWindow"`
	GitOpenCalled            bool   `json:"gitOpenCalled"`
	GitOpenPath              string `json:"gitOpenPath"`
	NormalizedKey            string `json:"normalizedKey,omitempty"`
	ErrorMessage             string `json:"errorMessage,omitempty"`
}

func Run(t *testing.T, req *Request) (*Response, error) {
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