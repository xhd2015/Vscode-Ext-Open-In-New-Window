## Expected
- Shows error when iTerm2 is not installed; does not call osascript.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Ok {
		t.Fatal("expected ok=false when iTerm2 is missing")
	}
	if resp.Error != "iterm-not-installed" {
		t.Fatalf("error=%q, want iterm-not-installed", resp.Error)
	}
	if resp.ExecFileCalled {
		t.Fatal("execFile must not be called when iTerm2 is missing")
	}
	if !strings.Contains(resp.ErrorMessage, "iTerm2 is not installed") {
		t.Fatalf("errorMessage=%q", resp.ErrorMessage)
	}
}
```