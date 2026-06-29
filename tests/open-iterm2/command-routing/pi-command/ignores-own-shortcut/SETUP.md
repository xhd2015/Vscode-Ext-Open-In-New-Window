# Scenario

**Feature**: command-routing / pi-command / ignores-own-shortcut

Palette **Open iTerm2: Pi** runs pi when Cmd+; is pi.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "pi"
	req.CommandId = "open-in-new-window.openITerm2Pi"
	return nil
}
```
