# Scenario

**Feature**: extension URI handler opens git repositories from `vscode://` deep links

```
# kool builds vscode:// URI and OS opens it
kool vscode open-git-repo <path> -> OS handler -> VS Code URI router

# extension handles /git-open, validates path, opens SCM repo
VS Code URI router -> Extension onUri handler -> openGitRepositoryAtPath -> git.openRepository
```

## Preconditions
- Node.js is available in PATH.
- The extension is compiled to `out/extension.js` (`npm run compile`).
- Tests invoke `TestExported_handleGitOpenUri` through a Node harness with a mocked `vscode` module.

## Steps
1. Each leaf sets `req.Scenario` and URI fields via `Setup`.
2. `Run` executes the Node harness at `testdata/harness/run.mjs` with the request JSON.
3. The harness creates temp fixtures, loads `out/extension.js`, runs the scenario, and returns JSON.
4. Each leaf asserts outcomes via `Assert`.

## Context
- **URI authority**: `xhd2015.open-in-new-window`
- **URI path**: `/git-open`
- **Query param**: `path` — absolute filesystem path (URL-encoded when delivered by kool)
- **Normalization**: `toGitRepositoryContextKey` before `git.openRepository`
- **no-git behavior**: silent skip (matches context-menu `gitOpenRepository` command)

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