# Scenario

**Feature**: IPC open succeeds for valid directory paths

```
# valid directory opens with default or replace window semantics
Extension ipc handler (open, valid dir, replace?) -> vscode.openFolder(forceNewWindow)
```

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```