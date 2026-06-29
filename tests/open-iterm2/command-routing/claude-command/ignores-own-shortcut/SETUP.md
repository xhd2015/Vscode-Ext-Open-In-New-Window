# Scenario

**Feature**: command-routing / claude-command / ignores-own-shortcut

Palette **Open iTerm2: Claude Code** runs claude when Cmd+; is claude.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "claude"
	req.CommandId = "open-in-new-window.openITerm2Claude"
	return nil
}
```
