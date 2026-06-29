# Scenario

**Feature**: command-routing / shortcut / with-claude-shortcut

Cmd+; is configured for Claude Code; shortcut command must run claude.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "claude"
	req.CommandId = "open-in-new-window.openITerm2Shortcut"
	return nil
}
```
