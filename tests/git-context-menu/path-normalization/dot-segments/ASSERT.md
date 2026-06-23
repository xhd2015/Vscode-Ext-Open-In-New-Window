## Expected
- `.` segments are collapsed by `path.normalize`.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.NormalizedKey != req.ExpectedKey {
		t.Fatalf("got %q want %q", resp.NormalizedKey, req.ExpectedKey)
	}
}
```