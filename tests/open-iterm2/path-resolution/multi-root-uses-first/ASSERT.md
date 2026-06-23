## Expected
- Multi-root workspace uses the first folder.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.TargetDir != "/workspace/a" {
		t.Fatalf("targetDir=%q, want /workspace/a", resp.TargetDir)
	}
}
```