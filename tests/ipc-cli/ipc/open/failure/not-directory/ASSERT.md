## Expected
- IPC response `ok` is false.
- Error message is non-empty.
- `openFolder` is not called.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.OK {
		t.Fatal("open must fail for non-directory path")
	}
	if resp.Error == "" {
		t.Fatal("error response must include error message")
	}
	if resp.OpenFolderCalled {
		t.Fatal("openFolder must not be called for file path")
	}
}
```