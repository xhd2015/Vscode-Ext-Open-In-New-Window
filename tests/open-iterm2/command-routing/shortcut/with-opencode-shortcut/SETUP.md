# Scenario

**Feature**: command-routing / shortcut / with-opencode-shortcut

Cmd+; is configured for OpenCode; shortcut command must run opencode.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "opencode"
	req.CommandId = "open-in-new-window.openITerm2Shortcut"
	return nil
}
```
