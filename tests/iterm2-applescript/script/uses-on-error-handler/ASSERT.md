## Expected
- Path probing is wrapped in `on error` so inaccessible sessions do not abort the script.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.UsesOnErrorHandler {
		t.Fatalf("script must include on error handler; got %q", resp.Script)
	}
}
```