# Scenario

**Feature**: command-routing / shortcut / default-no-stored

No stored shortcut preference; Cmd+; defaults to cd-only.

```go
func Setup(t *testing.T, req *Request) error {
	req.OmitShortcutActionId = true
	req.CommandId = "open-in-new-window.openITerm2Shortcut"
	return nil
}
```