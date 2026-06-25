# Scenario

**Feature**: command-routing / grok-command / ignores-cd-only-shortcut

Palette **Open iTerm2: Grok** runs grok when Cmd+; is cd-only.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "cd-only"
	req.CommandId = "open-in-new-window.openITerm2Grok"
	return nil
}
```