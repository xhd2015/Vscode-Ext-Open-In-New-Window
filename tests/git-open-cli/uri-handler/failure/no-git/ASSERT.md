## Expected
- `git.openRepository` is not called.
- No error message is shown (silent skip, matching context-menu command).

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.GitOpenCalled {
		t.Fatal("git.openRepository must not be called when directory has no .git")
	}
	if resp.ErrorMessage != "" {
		t.Fatalf("expected silent skip without error, got %q", resp.ErrorMessage)
	}
}
```