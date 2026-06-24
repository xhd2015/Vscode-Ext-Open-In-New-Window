# Scenario

**Feature**: ui / switch-shortcut-action-picker

## Steps
1. Set `req.Scenario` to `ui-switch-shortcut-action-picker`.
2. `Run` executes `npm run ui-test:switch-iterm2-shortcut` from the extension project root.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ui-switch-shortcut-action-picker"
	return nil
}
```