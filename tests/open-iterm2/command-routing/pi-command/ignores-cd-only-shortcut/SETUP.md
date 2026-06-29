# Scenario

**Feature**: command-routing / pi-command / ignores-cd-only-shortcut

Palette **Open iTerm2: Pi** runs pi when Cmd+; is cd-only.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "cd-only"
	req.CommandId = "open-in-new-window.openITerm2Pi"
	return nil
}
```
