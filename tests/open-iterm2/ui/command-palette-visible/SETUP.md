# Scenario

**Feature**: ui / command-palette-visible

## Steps
1. Set `req.Scenario` to `ui-command-palette-visible`.
2. `Run` executes `npm run ui-test:open-iterm2` from the extension project root.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ui-command-palette-visible"
	return nil
}
```