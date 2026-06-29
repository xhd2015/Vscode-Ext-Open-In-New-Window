---
label: ui-automation
explanation: >-
  Slow ExTester UI test. Launches real VS Code and asserts explorer context
  menu visibility for git vs non-git folders. Skipped in default discovery and
  short mode. Requires chromedriver (npm run ui-test:setup). Run via
  npm run ui-test after npm run ui-test:setup.
---

## Expected
- `npm run ui-test` exits 0.
- ExTester reports both UI cases passing:
  - nested git folder `x` shows "Git: Open Repository"
  - non-git folder `plain` does not show it

## Exit Code
- 0

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("ui-test failed: %v", err)
	}
	if resp.ExitCode != 0 {
		t.Fatalf("npm run ui-test exit code %d; output:\n%s", resp.ExitCode, resp.Output)
	}
}
```