## Expected
- New instance rebinds and becomes lease owner (`win-rebinder`).
- Ping succeeds after rebind.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.RebindWindowId != "win-rebinder" {
		t.Fatalf("rebind windowId=%q, want win-rebinder", resp.RebindWindowId)
	}
	if !resp.SurvivorPingOK {
		t.Fatal("rebound socket must answer ping after dead-pid rebind")
	}
}
```