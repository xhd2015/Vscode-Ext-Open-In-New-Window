# Scenario

**Feature**: unknown IPC op returns error

```
# unsupported operation name
kool CLI -> IPC server v2 ({"op":"nope"}) -> {"ok":false,"error":"..."}
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ipc-unknown-op"
	return nil
}
```