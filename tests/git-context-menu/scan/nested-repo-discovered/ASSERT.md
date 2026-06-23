## Expected
- Nested repo path is present in discovered paths with normalized key.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.NestedPresent {
		t.Fatalf("expected nested repo %q in discovered paths %v", resp.NormalizedKey, resp.DiscoveredPaths)
	}
}
```