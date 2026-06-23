## Expected
- Menu would show when `resourcePath` has a trailing slash.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.MenuWouldShow {
		t.Fatalf("menu must show for trailing-slash resource %q; paths=%v", resp.ResourcePath, resp.PublishedPaths)
	}
}
```