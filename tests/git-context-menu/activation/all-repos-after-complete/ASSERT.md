## Expected
- Published paths contain both the workspace root repo and the nested repo.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.AllExpectedPresent {
		t.Fatalf("expected all repos published, got %v want %v", resp.PublishedPaths, resp.ExpectedPaths)
	}
}
```