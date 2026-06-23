## Expected
- Menu would show for the git repo directory.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.MenuWouldShow {
		t.Fatalf("menu must show for published repo; paths=%v", resp.PublishedPaths)
	}
}
```