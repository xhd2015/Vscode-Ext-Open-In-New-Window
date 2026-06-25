# Scenario

**Feature**: command-routing / palette / with-grok-shortcut

Cmd+; is configured for Grok; palette **Open iTerm2** must still cd-only.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "grok"
	req.CommandId = "open-in-new-window.openITerm2"
	return nil
}
```