## Expected
- IPC response `ok` is true.
- `git.openRepository` is called with normalized repo path.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.OK {
		t.Fatalf("git-open must succeed, got error=%q", resp.Error)
	}
	if !resp.GitOpenCalled {
		t.Fatal("git.openRepository must be called for valid repo")
	}
	if resp.GitOpenPath != resp.NormalizedKey {
		t.Fatalf("git.openRepository path=%q, want normalized %q", resp.GitOpenPath, resp.NormalizedKey)
	}
}
```