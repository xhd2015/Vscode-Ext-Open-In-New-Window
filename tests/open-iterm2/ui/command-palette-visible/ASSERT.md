## Expected
- `npm run ui-test:open-iterm2` exits 0.
- ExTester reports the Open iTerm2 command is visible in the palette.

## Exit Code
- 0

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("ui-test failed: %v", err)
	}
	if resp.ExitCode != 0 {
		t.Fatalf("npm run ui-test:open-iterm2 exit code %d; output:\n%s", resp.ExitCode, resp.Output)
	}
}
```