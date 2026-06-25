## Expected
- Real `osascript` path scan exits successfully when iTerm2 is installed on macOS.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Skipped {
		t.Skipf("live scan smoke skipped: %s", resp.SkipReason)
	}
	if !resp.Ok {
		t.Fatalf("osascript scan smoke failed: stdout=%q error=%q script=%q", resp.Stdout, resp.Error, resp.Script)
	}
	if resp.Stdout != "ok" {
		t.Fatalf("stdout=%q, want ok", resp.Stdout)
	}
}
```