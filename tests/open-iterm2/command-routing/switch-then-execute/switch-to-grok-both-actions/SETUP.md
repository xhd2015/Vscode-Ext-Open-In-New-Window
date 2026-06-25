# Scenario

**Feature**: command-routing / switch-then-execute / switch-to-grok-both-actions

Start cd-only, switch to Grok, then run palette and shortcut commands.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "cd-only"
	req.Steps = []WorkflowStep{
		{Type: "switch-shortcut", ActionId: "grok"},
		{Type: "execute", CommandId: "open-in-new-window.openITerm2"},
		{Type: "execute", CommandId: "open-in-new-window.openITerm2Shortcut"},
	}
	return nil
}
```