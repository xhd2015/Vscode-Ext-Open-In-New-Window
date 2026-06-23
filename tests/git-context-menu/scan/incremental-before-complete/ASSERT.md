## Expected
- Depth-0 repo path is published to context before the deeper nested repo appears in any publish snapshot.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.Depth0PublishedBeforeComplete {
		t.Fatalf("depth-0 repo %q must be published before nested repo; history=%v", resp.RootKey, resp.ContextPublishHistory)
	}
}
```