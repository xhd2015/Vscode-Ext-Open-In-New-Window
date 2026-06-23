# Scenario

**Feature**: menu-visibility / path-keys-object-map

## Preconditions
- Extension activates and publishes git repository context for a discoverable repo.

## Steps
1. Activate extension with a git repo directory `repo/`.
2. Read `openInNewWindow.gitRepositoryPathKeys` from the mocked `setContext` calls.
3. Assert the menu path-key context is an object map (not an array).

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "menu-path-keys-object-map"
	return nil
}
```