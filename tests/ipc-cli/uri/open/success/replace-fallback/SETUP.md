# Scenario

**Feature**: `/open` URI with `replace=true` reuses current window

```
# kool --replace falls back to vscode:// with replace query
kool CLI -> OS handler -> Extension onUri (/open?path=...&replace=true) -> vscode.openFolder(forceNewWindow: false)
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "uri-open-replace-fallback"
	return nil
}
```