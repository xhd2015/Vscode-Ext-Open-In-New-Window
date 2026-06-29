# Scenario

**Feature**: command-routing / switch-shortcut / persists-pi

Switch Shortcut to Pi updates stored preference and confirmation message.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "cd-only"
	req.Steps = []WorkflowStep{
		{Type: "switch-shortcut", ActionId: "pi"},
	}
	return nil
}
```
