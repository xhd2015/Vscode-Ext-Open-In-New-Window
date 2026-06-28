# Scenario

**Feature**: IPC open requires path parameter

```
# missing path field
Extension ipc handler (open, no path) -> {"ok":false,"error":"..."}
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ipc-open-missing-path"
	return nil
}
```