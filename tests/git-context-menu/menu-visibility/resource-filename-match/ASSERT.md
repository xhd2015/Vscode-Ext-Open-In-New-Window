## Expected
- VS Code menu would show for nested repo `x/` via `resourceFilename in pathKeys`.
- Legacy array `includes` simulation must **not** match basename-only `resourceFilename`
  (this is the false-confidence gap that hid the real bug).

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.MenuWouldShowViaPathKeys {
		t.Fatalf(
			"menu must show via pathKeys when clause; resourceFilename=%q resourcePath=%q pathKeys=%#v",
			resp.ResourceFilename,
			resp.ResourcePath,
			resp.PublishedPathKeys,
		)
	}
	if resp.MenuWouldShowViaArrayIncludes {
		t.Fatalf(
			"legacy array.includes simulation must not match basename-only resourceFilename=%q; paths=%v",
			resp.ResourceFilename,
			resp.PublishedPaths,
		)
	}
}
```