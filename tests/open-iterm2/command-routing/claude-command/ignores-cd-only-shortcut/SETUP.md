# Scenario

**Feature**: command-routing / claude-command / ignores-cd-only-shortcut

Palette **Open iTerm2: Claude Code** runs claude when Cmd+; is cd-only.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "cd-only"
	req.CommandId = "open-in-new-window.openITerm2Claude"
	return nil
}
```
