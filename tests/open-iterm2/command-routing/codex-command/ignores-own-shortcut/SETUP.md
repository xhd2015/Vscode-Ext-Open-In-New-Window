# Scenario

**Feature**: command-routing / codex-command / ignores-own-shortcut

Palette **Open iTerm2: Codex** runs codex when Cmd+; is codex.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "codex"
	req.CommandId = "open-in-new-window.openITerm2Codex"
	return nil
}
```
