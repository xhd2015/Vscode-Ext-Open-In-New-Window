# Scenario

**Feature**: ui / explorer-menu-visible

## Steps
1. Set `req.Scenario` to `ui-explorer-menu-visible`.
2. `Run` executes `npm run ui-test` from the extension project root.
3. Parse the process exit code and combined output.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ui-explorer-menu-visible"
	return nil
}
```