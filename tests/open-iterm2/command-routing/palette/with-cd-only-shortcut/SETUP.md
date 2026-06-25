# Scenario

**Feature**: command-routing / palette / with-cd-only-shortcut

Cmd+; is cd-only; palette **Open iTerm2** must cd-only.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "cd-only"
	req.CommandId = "open-in-new-window.openITerm2"
	return nil
}
```