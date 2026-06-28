# Scenario

**Feature**: cold-start fallback opens folders via `/open` URI

```
# OS delivers vscode:// deep link when IPC is unreachable
kool CLI -> OS handler -> VS Code URI router -> Extension onUri handler
```

## Context
- All scenarios in this subtree exercise the `/open` URI handler entry point.

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```