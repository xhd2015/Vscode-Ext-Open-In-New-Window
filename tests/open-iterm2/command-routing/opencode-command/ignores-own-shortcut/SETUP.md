# Scenario

**Feature**: command-routing / opencode-command / ignores-own-shortcut

Palette **Open iTerm2: OpenCode** runs opencode when Cmd+; is opencode.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "opencode"
	req.CommandId = "open-in-new-window.openITerm2OpenCode"
	return nil
}
```
