## Expected
- Target directory is the single workspace folder.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.TargetDir != "/tmp/proj" {
		t.Fatalf("targetDir=%q, want /tmp/proj", resp.TargetDir)
	}
}
```