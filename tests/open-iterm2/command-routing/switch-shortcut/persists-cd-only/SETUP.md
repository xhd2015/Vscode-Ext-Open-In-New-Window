# Scenario

**Feature**: command-routing / switch-shortcut / persists-cd-only

Switch Shortcut back to cd-only updates stored preference and confirmation message.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "grok"
	req.Steps = []WorkflowStep{
		{Type: "switch-shortcut", ActionId: "cd-only"},
	}
	return nil
}
```