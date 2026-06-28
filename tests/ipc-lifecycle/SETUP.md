# Scenario

**Feature**: IPC v2 lease-based socket ownership across extension windows

```
# owner window binds socket and renews lease
Extension activate (owner) -> IPC server v2 + lease.json

# non-owner watches lease and rebinds when stale
Extension activate (survivor) -> watch lease -> rebind on stale/dead PID
```

## Preconditions
- Node.js is available in PATH.
- The extension is compiled to `out/extension.js` (`npm run compile`).
- Tests use a shared temp `kool` dir per scenario (not real `~/.kool/`).

## Steps
1. Each leaf sets `req.Scenario` via `Setup`.
2. `Run` executes the Node harness with the request JSON.
3. Harness simulates one or two extension instances with distinct `windowId` values.
4. Each leaf asserts lease/socket state and ping reachability.

## Context
- **Lease TTL**: 5 seconds; renew interval 2 seconds.
- **Socket file**: `xhd2015.open-in-new-window.sock` under kool dir.
- **Lease file**: `xhd2015.open-in-new-window.lease.json`.

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