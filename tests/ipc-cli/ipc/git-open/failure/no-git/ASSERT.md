## Expected
- IPC response `ok` is true (silent skip, not an error).
- `git.openRepository` is not called.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.OK {
		t.Fatalf("no-git should silently succeed, got error=%q", resp.Error)
	}
	if resp.GitOpenCalled {
		t.Fatal("git.openRepository must not be called without .git")
	}
}
```