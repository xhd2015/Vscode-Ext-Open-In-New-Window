# Scenario

**Feature**: IPC open focuses folder already open in workspace

```
# folder already in workspaceFolders — focus, no duplicate window
Extension ipc handler (open, existing) -> vscode.openFolder(forceNewWindow: false)
```

## Preconditions
- Mock workspace already contains the target directory.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ipc-open-focus-existing"
	return nil
}
```