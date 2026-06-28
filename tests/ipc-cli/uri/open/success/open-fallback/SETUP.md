# Scenario

**Feature**: `/open` URI cold-start fallback opens valid directory

```
# kool falls back to vscode:// when IPC unreachable
kool CLI -> OS handler -> Extension onUri (/open?path=...) -> vscode.openFolder
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "uri-open-fallback"
	return nil
}
```