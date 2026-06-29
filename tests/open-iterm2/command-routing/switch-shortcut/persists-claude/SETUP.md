# Scenario

**Feature**: command-routing / switch-shortcut / persists-claude

Switch Shortcut to Claude Code updates stored preference and confirmation message.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "cd-only"
	req.Steps = []WorkflowStep{
		{Type: "switch-shortcut", ActionId: "claude"},
	}
	return nil
}
```
