# Scenario

**Feature**: command-routing / shortcut / with-unknown-shortcut

Stored shortcut id is invalid; Cmd+; falls back to cd-only.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "missing-action"
	req.CommandId = "open-in-new-window.openITerm2Shortcut"
	return nil
}
```