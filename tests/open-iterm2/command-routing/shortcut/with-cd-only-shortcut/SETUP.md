# Scenario

**Feature**: command-routing / shortcut / with-cd-only-shortcut

Cmd+; is cd-only; shortcut command must cd-only.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "cd-only"
	req.CommandId = "open-in-new-window.openITerm2Shortcut"
	return nil
}
```