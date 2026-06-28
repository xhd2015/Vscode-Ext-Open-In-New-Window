## Expected
- `vscode.openFolder` is called exactly once.
- `forceNewWindow` is true (default new-window behavior).
- Opened path matches normalized directory key.
- No error message is shown.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.OpenFolderCalled {
		t.Fatal("openFolder must be called for valid /open URI")
	}
	if !resp.OpenFolderForceNewWindow {
		t.Fatal("openFolder must use forceNewWindow: true for default /open URI")
	}
	if resp.OpenFolderPath != resp.NormalizedKey {
		t.Fatalf("openFolder path=%q, want normalized %q", resp.OpenFolderPath, resp.NormalizedKey)
	}
	if resp.ErrorMessage != "" {
		t.Fatalf("expected no error message, got %q", resp.ErrorMessage)
	}
}
```