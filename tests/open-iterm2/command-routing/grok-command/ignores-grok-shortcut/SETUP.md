# Scenario

**Feature**: command-routing / grok-command / ignores-grok-shortcut

Palette **Open iTerm2: Grok** still runs grok when Cmd+; is already grok.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "grok"
	req.CommandId = "open-in-new-window.openITerm2Grok"
	return nil
}
```