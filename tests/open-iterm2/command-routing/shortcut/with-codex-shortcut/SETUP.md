# Scenario

**Feature**: command-routing / shortcut / with-codex-shortcut

Cmd+; is configured for Codex; shortcut command must run codex.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "codex"
	req.CommandId = "open-in-new-window.openITerm2Shortcut"
	return nil
}
```
