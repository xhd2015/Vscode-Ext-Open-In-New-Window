## Expected
- Git repo under `node_modules` is not included in discovered paths.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.HiddenSkipped {
		t.Fatalf("node_modules repo must be skipped; discovered=%v", resp.DiscoveredPaths)
	}
}
```