## Expected
- `vscode.openFolder` is called exactly once.
- `forceNewWindow` is false (`replace=true` query reuses current window).
- Opened path matches normalized directory key.
- No error message is shown.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.OpenFolderCalled {
		t.Fatal("openFolder must be called for /open URI with replace=true")
	}
	if resp.OpenFolderForceNewWindow {
		t.Fatal("openFolder must use forceNewWindow: false when replace=true")
	}
	if resp.OpenFolderPath != resp.NormalizedKey {
		t.Fatalf("openFolder path=%q, want normalized %q", resp.OpenFolderPath, resp.NormalizedKey)
	}
	if resp.ErrorMessage != "" {
		t.Fatalf("expected no error message, got %q", resp.ErrorMessage)
	}
}
```