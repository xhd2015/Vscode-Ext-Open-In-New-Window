## Expected
- `openFolder` is called with `forceNewWindow: false`.
- Path matches normalized workspace folder.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
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