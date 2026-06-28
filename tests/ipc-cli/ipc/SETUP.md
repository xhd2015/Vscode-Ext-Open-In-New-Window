# Scenario

**Feature**: kool CLI talks to extension over IPC v2 socket

```
# JSON-line request over Unix socket
kool CLI -> IPC server v2 -> Extension ipc handler
```

## Context
- All scenarios in this subtree exercise the IPC socket entry point.

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```