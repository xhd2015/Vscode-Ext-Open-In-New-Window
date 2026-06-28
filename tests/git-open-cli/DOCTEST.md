# Git Open CLI / URI Handler Tests

Doc-style tests for opening a local git repository in the current VS Code
window's SCM view via `vscode://` URI handling (`/git-open?path=`).

The kool CLI (`kool vscode open-git-repo`) builds and opens these URIs; this
tree exercises the extension side: URI parsing, path validation, normalization,
and `git.openRepository` invocation through `openGitRepositoryAtPath`.

## Version

0.0.2

## DSN (Domain Specific Notion)

### Participants
- **kool CLI** — `kool-vscode/vscode.go`; validates repo path, builds
  `vscode://xhd2015.open-in-new-window/git-open?path=<encoded>`, opens via OS handler.
- **VS Code URI router** — delivers `vscode://` URIs to the extension `onUri` handler.
- **Extension** — `src/extension.ts`; registers URI handler for `/git-open`, parses
  `path` query, validates directory + `.git`, calls shared `openGitRepositoryAtPath`.
- **`openGitRepositoryAtPath`** — shared helper used by context-menu command and URI handler.
- **Node harness** — `testdata/harness/run.mjs` loads compiled `out/extension.js` with a
  mocked `vscode` module and invokes exported test hooks.
- **`git.openRepository`** — VS Code built-in command that adds the repo to SCM view.

### Behaviors
- **URI success** — valid directory with `.git` (directory or worktree file) → normalize path →
  `git.openRepository(normalizedPath)`.
- **URI failure** — missing/empty `path` query, non-directory, or missing `.git` → error or
  silent skip (no-git matches context-menu behavior).
- **Path normalization** — URL-decode query value, strip trailing slash, resolve to canonical key
  via `toGitRepositoryContextKey` before `git.openRepository`.

## Decision Tree

```
uri-handler/
├── success/
│   ├── valid-path/           → git.openRepository with normalized absolute path
│   ├── encoded-path/         → percent-encoded path decoded and opened
│   ├── trailing-slash/       → trailing slash stripped before open
│   └── worktree-git-file/    → .git file worktree accepted
└── failure/
    ├── missing-path-query/   → error; git.openRepository not called
    ├── empty-path-query/     → error; git.openRepository not called
    ├── not-directory/        → error; git.openRepository not called
    └── no-git/               → silent skip; git.openRepository not called
```

## Test Index

| # | Path | Description |
|---|------|-------------|
| 1 | `uri-handler/success/valid-path/` | Opens valid git repo via URI |
| 2 | `uri-handler/success/encoded-path/` | URL-decoded path opens correctly |
| 3 | `uri-handler/success/trailing-slash/` | Trailing slash normalized before open |
| 4 | `uri-handler/success/worktree-git-file/` | Worktree `.git` file repo opens |
| 5 | `uri-handler/failure/missing-path-query/` | Missing `path` query surfaces error |
| 6 | `uri-handler/failure/empty-path-query/` | Empty `path` query surfaces error |
| 7 | `uri-handler/failure/not-directory/` | Non-directory path surfaces error |
| 8 | `uri-handler/failure/no-git/` | Directory without `.git` silently skipped |

URI building and OS `open` invocation are covered in `kool-vscode/tests/vscode/open-git-repo/`.

## How to Run

```sh
npm run compile
doctest vet ./tests/git-open-cli
doctest test ./tests/git-open-cli
```

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
	URIPath  string `json:"uriPath"`
	Query    string `json:"query"`
}

type Response struct {
	GitOpenCalled bool   `json:"gitOpenCalled"`
	GitOpenPath   string `json:"gitOpenPath"`
	ErrorMessage  string `json:"errorMessage"`
	NormalizedKey string `json:"normalizedKey"`
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