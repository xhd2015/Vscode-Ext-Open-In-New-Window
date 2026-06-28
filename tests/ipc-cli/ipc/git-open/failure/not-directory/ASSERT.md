## Expected
- IPC response `ok` is false.
- `git.openRepository` is not called.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.OK {
		t.Fatal("git-open must fail for non-directory path")
	}
	if resp.Error == "" {
		t.Fatal("error response must include error message")
	}
	if resp.GitOpenCalled {
		t.Fatal("git.openRepository must not be called for file path")
	}
}
```