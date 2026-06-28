# Scenario

**Feature**: IPC `open` operation opens directories in VS Code

```
# open op normalizes path and maps replace -> forceNewWindow
Extension ipc handler (open, replace?) -> vscode.openFolder(uri, {forceNewWindow})
```

## Context
- Default (`replace` absent): `forceNewWindow: true` — new window; focus if already open.
- `replace: true`: `forceNewWindow: false` — replace current window.

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```