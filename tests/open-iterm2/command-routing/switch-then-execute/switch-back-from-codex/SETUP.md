# Scenario

**Feature**: command-routing / switch-then-execute / switch-back-from-codex

Start Codex, switch back to cd-only, then run palette and shortcut commands.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "codex"
	req.Steps = []WorkflowStep{
		{Type: "switch-shortcut", ActionId: "cd-only"},
		{Type: "execute", CommandId: "open-in-new-window.openITerm2"},
		{Type: "execute", CommandId: "open-in-new-window.openITerm2Shortcut"},
	}
	return nil
}
```