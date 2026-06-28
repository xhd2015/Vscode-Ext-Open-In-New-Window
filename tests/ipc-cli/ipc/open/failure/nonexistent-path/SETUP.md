# Scenario

**Feature**: IPC open rejects nonexistent paths

```
# path does not exist on disk
Extension ipc handler (open, /missing) -> {"ok":false,"error":"..."}
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ipc-open-nonexistent-path"
	return nil
}
```