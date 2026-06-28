## Expected
- New instance rebinds with `windowId` `win-rebinder`.
- Lease is no longer expired after rebind.
- Ping succeeds.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.RebindWindowId != "win-rebinder" {
		t.Fatalf("rebind windowId=%q, want win-rebinder", resp.RebindWindowId)
	}
	if resp.LeaseExpired {
		t.Fatal("lease must be renewed after rebind")
	}
	if !resp.SurvivorPingOK {
		t.Fatal("rebound socket must answer ping after expired-lease rebind")
	}
}
```