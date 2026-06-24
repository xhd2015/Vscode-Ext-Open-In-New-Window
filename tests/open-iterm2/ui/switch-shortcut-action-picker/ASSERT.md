## Expected
- `npm run ui-test:switch-iterm2-shortcut` exits 0.
- ExTester selects **Switch Shortcut** from the command palette and the action picker shows **Open iTerm2** and **Open iTerm2: Grok**.

## Exit Code
- 0

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("ui-test failed: %v", err)
	}
	if resp.ExitCode != 0 {
		t.Fatalf("npm run ui-test:switch-iterm2-shortcut exit code %d; output:\n%s", resp.ExitCode, resp.Output)
	}
}
```