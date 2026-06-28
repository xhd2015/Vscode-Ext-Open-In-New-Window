# Scenario

**Feature**: IPC open rejects invalid paths

```
# invalid path surfaces error response
Extension ipc handler (open, invalid) -> {"ok":false,"error":"..."}
```

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```