## Expected
- The first context publish must not be an empty array when repos are discoverable.
- After activation completes, published paths include the workspace git repo.

## Side Effects
- `openInNewWindow.gitRepositoryPaths` context is published with at least one path.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.FirstPublishEmpty {
		t.Fatal("first publish must not be empty when discoverable repos exist")
	}
	if len(resp.PublishedPaths) == 0 {
		t.Fatal("published paths must not be empty after activate completes")
	}
}
```