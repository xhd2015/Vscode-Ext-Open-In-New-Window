## Expected
- IPC response `ok` is false.
- Error message is non-empty.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.OK {
		t.Fatal("unknown op must return ok=false")
	}
	if resp.Error == "" {
		t.Fatal("error response must include error message")
	}
}
```