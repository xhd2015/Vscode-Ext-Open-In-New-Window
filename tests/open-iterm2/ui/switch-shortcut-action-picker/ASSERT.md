---
label: ui-automation
explanation: >-
  Slow ExTester UI test. Launches real VS Code, opens Switch Shortcut, and
  asserts all six action picker labels. Skipped in default discovery and short
  mode. Requires chromedriver (npm run ui-test:setup). Run via
  npm run ui-test:switch-iterm2-shortcut after npm run ui-test:setup.
---

## Expected
- `npm run ui-test:switch-iterm2-shortcut` exits 0.
- ExTester selects **Switch Shortcut** from the command palette and the action picker shows all six actions: **Open iTerm2**, **Open iTerm2: Grok**, **Open iTerm2: Codex**, **Open iTerm2: Claude Code**, **Open iTerm2: OpenCode**, and **Open iTerm2: Pi**.

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