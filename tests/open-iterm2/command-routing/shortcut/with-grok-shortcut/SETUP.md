# Scenario

**Feature**: command-routing / shortcut / with-grok-shortcut

Cmd+; is configured for Grok; shortcut command must run grok.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "grok"
	req.CommandId = "open-in-new-window.openITerm2Shortcut"
	return nil
}
```