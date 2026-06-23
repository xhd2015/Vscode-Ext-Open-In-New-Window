## Expected
- Menu would show when right-clicking the symlinked git repo directory.
- Published paths must include an entry that matches the symlink `resourcePath`.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.MenuWouldShow {
		t.Fatalf(
			"menu must show for symlink resourcePath; vscodeResourcePath=%q publishedKey=%q publishedPaths=%v",
			resp.VscodeResourcePath,
			resp.PublishedKey,
			resp.PublishedPaths,
		)
	}
}
```