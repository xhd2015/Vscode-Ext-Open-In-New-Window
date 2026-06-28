# Scenario

**Feature**: IPC rejects unknown operations

```
# unknown op returns protocol error
Extension ipc handler (unknown op) -> {"ok":false,"error":"..."}
```

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```