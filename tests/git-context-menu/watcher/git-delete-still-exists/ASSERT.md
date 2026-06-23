## Expected
- Repo path remains in cache because `.git` still exists after the delete event.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.PathInCacheAfterDelete {
		t.Fatalf("repo %q must stay cached when .git still exists; published=%v", resp.RepoKey, resp.PublishedPaths)
	}
}
```