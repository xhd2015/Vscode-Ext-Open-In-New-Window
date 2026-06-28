# Scenario

**Feature**: extension serves kool CLI via IPC v2 and `/open` URI handler

```
# kool sends JSON-line request over Unix socket
kool CLI -> IPC server v2 -> Extension handler -> vscode.openFolder / git.openRepository

# cold-start fallback via vscode:// URI
kool CLI -> OS handler -> VS Code URI router -> Extension onUri handler -> vscode.openFolder
```

## Preconditions
- Node.js is available in PATH.
- The extension is compiled to `out/extension.js` (`npm run compile`).
- Tests invoke `TestExported_ipcHandleRequest` and `TestExported_handleOpenUri`
  through a Node harness with a mocked `vscode` module.

## Steps
1. Each leaf sets `req.Scenario` via `Setup`.
2. `Run` executes the Node harness at `testdata/harness/run.mjs` with the request JSON.
3. The harness creates temp fixtures, loads `out/extension.js`, runs the scenario, and returns JSON.
4. Each leaf asserts outcomes via `Assert`.

## Context
- **IPC protocol**: one JSON object per line;
  `{"op":"ping"|"open"|"git-open","path":"...","replace":true?}`.
- **IPC response**: `{"ok":true,"version":"..."}` or `{"ok":false,"error":"..."}`.
- **`open` semantics**: default (`replace` absent/false) uses `forceNewWindow: true`
  (new window; VS Code focuses if folder already open). `replace: true` uses
  `forceNewWindow: false` (replace current window).
- **`git-open` no-git**: silent skip (matches context-menu and URI behavior).
- **Socket path**: overridden to a temp dir per scenario (not real `~/.kool/`).

```go
import (
	"fmt"
	"os/exec"
	"testing"
)

func Setup(t *testing.T, req *Request) error {
	_, err := exec.LookPath("node")
	if err != nil {
		return fmt.Errorf("node not found in PATH: %w", err)
	}
	return nil
}
```