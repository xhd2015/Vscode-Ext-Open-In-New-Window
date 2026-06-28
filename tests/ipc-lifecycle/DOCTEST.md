# IPC Lifecycle Tests

Doc-style tests for IPC server v2 lease-based socket ownership: bind, transfer,
stale lease recovery, and clean deactivation.

## Version

0.0.2

## DSN (Domain Specific Notion)

### Participants
- **IPC server v2** — one Unix socket per extension id; only the lease owner
  accepts connections.
- **Lease file** — `~/.kool/xhd2015.open-in-new-window.lease.json` records
  `{pid, windowId, socketPath, expiresAt}`; owner renews every 2s (5s TTL).
- **Owner window** — first activated VS Code window that binds socket and writes lease.
- **Survivor window** — another VS Code window watching the lease; rebinds when
  owner is gone, PID is dead, or lease is expired.
- **Extension activate/deactivate** — `activate` starts or reclaims IPC;
  `deactivate` stops server, unlinks socket, clears lease.
- **Node harness** — simulates multiple extension instances with distinct
  `windowId` values and a shared temp kool dir.

### Behaviors
- **First bind** — empty kool dir → activate claims socket + lease → ping succeeds.
- **Owner holds lease** — second activate while owner alive does not steal socket.
- **Transfer on deactivate** — owner deactivates → survivor detects stale lease → rebinds → ping succeeds on survivor.
- **Dead PID rebind** — lease references nonexistent PID → survivor rebinds.
- **Expired lease rebind** — `expiresAt` in the past → survivor rebinds.
- **Clean deactivate** — owner deactivates → socket file removed, lease cleared.

## Decision Tree

```
lifecycle-event
├── bind/
│   └── first-host-owns/              → socket + lease created, ping ok
├── transfer/
│   └── owner-deactivate-survivor-rebinds/  → survivor takes over after owner exit
├── stale/
│   ├── dead-pid-rebind/              → dead lease PID triggers rebind
│   └── expired-lease-rebind/         → past expiresAt triggers rebind
└── deactivate/
    └── owner-releases/               → socket unlinked, lease cleared
```

## Test Index

| # | Path | Description |
|---|------|-------------|
| 1 | `bind/first-host-owns/` | First activation owns socket and lease |
| 2 | `transfer/owner-deactivate-survivor-rebinds/` | Survivor rebinds after owner deactivate |
| 3 | `stale/dead-pid-rebind/` | Dead PID in lease triggers survivor rebind |
| 4 | `stale/expired-lease-rebind/` | Expired lease triggers survivor rebind |
| 5 | `deactivate/owner-releases/` | Deactivate removes socket and clears lease |

Protocol op tests live in `tests/ipc-cli/`.

## How to Run

```sh
npm run compile
doctest vet ./tests/ipc-lifecycle
doctest test ./tests/ipc-lifecycle
```

Required test exports from `src/extension.ts`:
- `TestExported_setKoolDirForTest(dir string)`
- `TestExported_setWindowIdForTest(windowId string)`
- `TestExported_waitForIpcReady() error`
- `TestExported_getIpcLeaseState() (LeaseState, error)`
- `TestExported_forceLeaseWatchForTest() error`
- `TestExported_ipcPing(socketPath string) (PingResponse, error)`

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
	SocketPath          string `json:"socketPath"`
	SocketExists        bool   `json:"socketExists"`
	LeaseExists         bool   `json:"leaseExists"`
	LeaseWindowId       string `json:"leaseWindowId,omitempty"`
	LeasePID            int    `json:"leasePID,omitempty"`
	LeaseExpired        bool   `json:"leaseExpired,omitempty"`
	HadActiveLease      bool   `json:"hadActiveLease,omitempty"`
	OwnerPingOK         bool   `json:"ownerPingOK"`
	SurvivorPingOK      bool   `json:"survivorPingOK,omitempty"`
	RebindWindowId      string `json:"rebindWindowId,omitempty"`
	RebindCount         int    `json:"rebindCount,omitempty"`
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