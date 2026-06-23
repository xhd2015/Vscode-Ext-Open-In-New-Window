## Expected
- `openInNewWindow.gitRepositoryPathKeys` is published as an object map for VS Code `in` checks.
- `openInNewWindow.gitRepositoryPaths` remains an array for debugging and legacy consumers.
- Object map contains both the canonical full path and the basename (`repo`).

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.PathKeysIsObject {
		t.Fatalf("pathKeys must be an object map; got %#v", resp.PublishedPathKeys)
	}
	if !resp.PathsContextIsArray {
		t.Fatalf("gitRepositoryPaths must remain an array; got %#v", resp.PublishedPaths)
	}
	if !resp.HasFullPathKey {
		t.Fatalf("pathKeys must include full repo path %q; keys=%#v", resp.RepoKey, resp.PublishedPathKeys)
	}
	if !resp.HasBasenameKey {
		t.Fatalf("pathKeys must include basename key %q; keys=%#v", "repo", resp.PublishedPathKeys)
	}
}
```