## Expected
- New repo path is added to published paths.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.PathAdded {
		t.Fatalf("repo %q must be added by watcher create; published=%v", resp.RepoKey, resp.PublishedPaths)
	}
}
```