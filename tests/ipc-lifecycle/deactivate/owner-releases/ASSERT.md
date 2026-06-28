## Expected
- Owner successfully bound socket and lease before deactivate (`hadActiveLease`).
- Socket file is removed after deactivate.
- Lease file is removed or invalidated (no active lease).
- Ping fails (socket unreachable).

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.HadActiveLease {
		t.Fatal("precondition: owner must bind socket and lease before deactivate")
	}
	if resp.SocketExists {
		t.Fatal("socket file must be removed after owner deactivate")
	}
	if resp.LeaseExists {
		t.Fatal("lease file must be cleared after owner deactivate")
	}
	if resp.OwnerPingOK {
		t.Fatal("ping must fail after socket removed")
	}
}
```