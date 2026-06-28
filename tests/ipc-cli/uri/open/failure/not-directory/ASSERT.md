## Expected
- Error message is non-empty.
- `openFolder` is not called.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.ErrorMessage == "" {
		t.Fatal("not-directory must surface error message")
	}
	if resp.OpenFolderCalled {
		t.Fatal("openFolder must not be called for file path")
	}
}
```