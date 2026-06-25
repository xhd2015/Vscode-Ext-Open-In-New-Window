## Expected
- Existing paths are normalized before being embedded in AppleScript.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.TargetDir != "/private/tmp/proj" {
		t.Fatalf("targetDir=%q, want /private/tmp/proj", resp.TargetDir)
	}
}
```