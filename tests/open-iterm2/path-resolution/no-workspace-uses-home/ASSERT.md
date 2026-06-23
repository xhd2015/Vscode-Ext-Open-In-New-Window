## Expected
- Target directory falls back to home when no workspace is open.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.TargetDir != "/Users/tester" {
		t.Fatalf("targetDir=%q, want /Users/tester", resp.TargetDir)
	}
}
```