## Expected
- Menu would show when VS Code `resourcePath` uses realpath spelling (e.g. macOS `/private/var/...`).
- Published paths must include an entry that matches the realpath `resourcePath`.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.MenuWouldShow {
		t.Fatalf(
			"menu must show for realpath resourcePath; vscodeResourcePath=%q publishedKey=%q publishedPaths=%v",
			resp.VscodeResourcePath,
			resp.PublishedKey,
			resp.PublishedPaths,
		)
	}
}
```