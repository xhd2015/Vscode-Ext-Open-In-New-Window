# Scenario

**Feature**: command-routing / opencode-command / ignores-cd-only-shortcut

Palette **Open iTerm2: OpenCode** runs opencode when Cmd+; is cd-only.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "cd-only"
	req.CommandId = "open-in-new-window.openITerm2OpenCode"
	return nil
}
```
