# Scenario

**Feature**: trailing slash stripped before IPC open

```
# path with trailing slash normalized
Extension ipc handler (open, /abs/project/) -> vscode.openFolder(/abs/project)
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ipc-open-trailing-slash"
	return nil
}
```