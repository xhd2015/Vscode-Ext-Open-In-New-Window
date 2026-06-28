## Expected
- Error message mentions empty path.
- `openFolder` is not called.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.ErrorMessage == "" {
		t.Fatal("empty path query must surface error message")
	}
	if resp.OpenFolderCalled {
		t.Fatal("openFolder must not be called with empty path query")
	}
}
```