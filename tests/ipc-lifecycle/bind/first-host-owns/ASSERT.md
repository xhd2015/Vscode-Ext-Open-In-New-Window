## Expected
- Socket file exists after activate.
- Lease file exists with `windowId` matching owner.
- Ping over socket returns `ok: true`.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.SocketExists {
		t.Fatal("socket file must exist after first bind")
	}
	if !resp.LeaseExists {
		t.Fatal("lease file must exist after first bind")
	}
	if resp.LeaseWindowId != "win-owner" {
		t.Fatalf("lease windowId=%q, want win-owner", resp.LeaseWindowId)
	}
	if !resp.OwnerPingOK {
		t.Fatal("owner must answer ping on bound socket")
	}
}
```