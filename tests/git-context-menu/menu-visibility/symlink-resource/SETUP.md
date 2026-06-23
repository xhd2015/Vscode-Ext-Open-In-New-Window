# Scenario

**Feature**: menu-visibility / symlink-resource

## Preconditions
- Workspace contains a git repo accessed through a directory symlink.

## Steps
1. Activate extension and publish discovered git repo paths.
2. Evaluate menu visibility for the symlink path (what explorer right-click uses).

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "menu-symlink-resource"
	return nil
}
```