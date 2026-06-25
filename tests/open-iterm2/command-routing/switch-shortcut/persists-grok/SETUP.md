# Scenario

**Feature**: command-routing / switch-shortcut / persists-grok

Switch Shortcut to Grok updates stored preference and confirmation message.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "cd-only"
	req.Steps = []WorkflowStep{
		{Type: "switch-shortcut", ActionId: "grok"},
	}
	return nil
}
```