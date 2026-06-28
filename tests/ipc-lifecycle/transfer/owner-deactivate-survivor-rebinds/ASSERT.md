## Expected
- After owner deactivate, socket still exists (survivor rebound).
- Lease `windowId` is `win-survivor`.
- Ping succeeds on rebound socket.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.SocketExists {
		t.Fatal("socket must exist after survivor rebind")
	}
	if resp.RebindWindowId != "win-survivor" {
		t.Fatalf("rebind windowId=%q, want win-survivor", resp.RebindWindowId)
	}
	if !resp.SurvivorPingOK {
		t.Fatal("survivor must answer ping after rebind")
	}
	if resp.RebindCount < 1 {
		t.Fatal("expected at least one rebind")
	}
}
```