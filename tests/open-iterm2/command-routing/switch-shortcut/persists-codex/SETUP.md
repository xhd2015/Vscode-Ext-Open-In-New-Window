# Scenario

**Feature**: command-routing / switch-shortcut / persists-codex

Switch Shortcut to Codex updates stored preference and confirmation message.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "cd-only"
	req.Steps = []WorkflowStep{
		{Type: "switch-shortcut", ActionId: "codex"},
	}
	return nil
}
```
