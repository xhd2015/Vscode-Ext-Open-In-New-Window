# Scenario

**Feature**: open valid directory via IPC

```
# normalized absolute path opens folder
Extension ipc handler (open, /abs/project) -> vscode.openFolder(forceNewWindow: true)
```

## Steps
1. Create temp directory.
2. Send `{"op":"open","path":"<dir>"}`.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ipc-open-valid-dir"
	return nil
}
```