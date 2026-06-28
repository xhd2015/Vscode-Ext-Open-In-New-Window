## Expected
- IPC response `ok` is true.
- `vscode.openFolder` is called exactly once.
- `forceNewWindow` is true (default new-window behavior).
- Opened path matches normalized directory key.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.OK {
		t.Fatalf("open must succeed, got error=%q", resp.Error)
	}
	if !resp.OpenFolderCalled {
		t.Fatal("openFolder must be called for valid directory")
	}
	if !resp.OpenFolderForceNewWindow {
		t.Fatal("openFolder must use forceNewWindow: true for default open")
	}
	if resp.OpenFolderPath != resp.NormalizedKey {
		t.Fatalf("openFolder path=%q, want normalized %q", resp.OpenFolderPath, resp.NormalizedKey)
	}
}
```