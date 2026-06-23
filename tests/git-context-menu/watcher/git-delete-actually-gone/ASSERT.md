## Expected
- Repo path is removed from published paths when `.git` is actually gone.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.PathRemoved {
		t.Fatalf("repo %q must be removed when .git is gone; published=%v", resp.RepoKey, resp.PublishedPaths)
	}
}
```