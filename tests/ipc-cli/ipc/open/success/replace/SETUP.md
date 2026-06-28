# Scenario

**Feature**: IPC open with `replace: true` reuses current window

```
# replace flag maps to forceNewWindow: false
Extension ipc handler (open, /abs/project, replace:true) -> vscode.openFolder(forceNewWindow: false)
```

## Steps
1. Create temp directory.
2. Send `{"op":"open","path":"<dir>","replace":true}`.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ipc-open-replace"
	return nil
}
```