## Expected
- `git.openRepository` is called with the decoded normalized path.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.GitOpenCalled {
		t.Fatal("git.openRepository must be called for encoded valid path")
	}
	if resp.GitOpenPath != resp.NormalizedKey {
		t.Fatalf("git.openRepository path=%q, want normalized %q", resp.GitOpenPath, resp.NormalizedKey)
	}
}
```