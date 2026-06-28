## Expected
- IPC response `ok` is true.
- `vscode.openFolder` is called exactly once.
- `forceNewWindow` is false (`replace: true` reuses current window).
- Opened path matches normalized directory key.

## Side Effects
- No duplicate window is requested; current window is replaced.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.OK {
		t.Fatalf("open with replace must succeed, got error=%q", resp.Error)
	}
	if !resp.OpenFolderCalled {
		t.Fatal("openFolder must be called for valid directory with replace")
	}
	if resp.OpenFolderForceNewWindow {
		t.Fatal("openFolder must use forceNewWindow: false when replace is true")
	}
	if resp.OpenFolderPath != resp.NormalizedKey {
		t.Fatalf("openFolder path=%q, want normalized %q", resp.OpenFolderPath, resp.NormalizedKey)
	}
}
```