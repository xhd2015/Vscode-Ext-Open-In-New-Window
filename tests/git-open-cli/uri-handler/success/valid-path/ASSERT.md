## Expected
- `git.openRepository` is called exactly once.
- Path passed to `git.openRepository` matches the normalized repo key.

## Side Effects
- No error message is shown.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.GitOpenCalled {
		t.Fatal("git.openRepository must be called for valid git repo path")
	}
	if resp.GitOpenPath != resp.NormalizedKey {
		t.Fatalf("git.openRepository path=%q, want normalized %q", resp.GitOpenPath, resp.NormalizedKey)
	}
	if resp.ErrorMessage != "" {
		t.Fatalf("expected no error message, got %q", resp.ErrorMessage)
	}
}
```