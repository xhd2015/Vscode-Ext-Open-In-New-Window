## Expected
- Watcher-added repo path remains in published paths after refresh completes.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.WatcherPathSurvived {
		t.Fatalf("watcher path %q must survive refresh; published=%v", resp.WatcherKey, resp.PublishedPaths)
	}
}
```