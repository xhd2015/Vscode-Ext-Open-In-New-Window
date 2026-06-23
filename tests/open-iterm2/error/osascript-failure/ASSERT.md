## Expected
- Surfaces osascript failure to the user.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Ok {
		t.Fatal("expected ok=false when osascript fails")
	}
	if !resp.ExecFileCalled {
		t.Fatal("execFile must be called before failure")
	}
	if !strings.Contains(resp.ErrorMessage, "Unable to open iTerm2") {
		t.Fatalf("errorMessage=%q", resp.ErrorMessage)
	}
}
```