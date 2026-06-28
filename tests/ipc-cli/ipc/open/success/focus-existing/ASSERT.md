## Expected
- IPC response `ok` is true.
- `openFolder` is called with `forceNewWindow: false`.
- Path matches the already-open workspace folder (normalized).

## Side Effects
- VS Code focus semantics are delegated to `openFolder`; harness verifies
  `forceNewWindow: false` so no forced duplicate window is requested.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.OK {
		t.Fatalf("open must succeed for existing folder, got error=%q", resp.Error)
	}
	if !resp.OpenFolderCalled {
		t.Fatal("openFolder must be called to focus existing folder")
	}
	if resp.OpenFolderForceNewWindow {
		t.Fatal("must not force new window when folder already open")
	}
	if resp.OpenFolderPath != resp.NormalizedKey {
		t.Fatalf("openFolder path=%q, want normalized %q", resp.OpenFolderPath, resp.NormalizedKey)
	}
}
```