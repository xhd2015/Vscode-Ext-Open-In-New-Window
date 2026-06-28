# Scenario

**Feature**: `/open` URI handler mirrors IPC open semantics

```
# URI path /open with path and optional replace query
VS Code URI router -> Extension onUri handler (/open?path=...&replace=true?) -> vscode.openFolder(forceNewWindow)
```

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```