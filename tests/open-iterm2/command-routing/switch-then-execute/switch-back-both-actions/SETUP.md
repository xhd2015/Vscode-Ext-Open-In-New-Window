# Scenario

**Feature**: command-routing / switch-then-execute / switch-back-both-actions

Start Grok, switch back to cd-only, then run palette and shortcut commands.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "grok"
	req.Steps = []WorkflowStep{
		{Type: "switch-shortcut", ActionId: "cd-only"},
		{Type: "execute", CommandId: "open-in-new-window.openITerm2"},
		{Type: "execute", CommandId: "open-in-new-window.openITerm2Shortcut"},
	}
	return nil
}
```