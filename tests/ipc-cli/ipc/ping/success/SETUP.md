# Scenario

**Feature**: ping returns ok and protocol version

```
# health probe succeeds
kool CLI -> IPC server v2 ({"op":"ping"}) -> {"ok":true,"version":"0.0.1"}
```

## Steps
1. Activate extension with IPC server bound to temp socket.
2. Send `{"op":"ping"}` and capture response.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ipc-ping-success"
	return nil
}
```