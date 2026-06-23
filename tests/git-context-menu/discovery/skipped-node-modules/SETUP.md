# Scenario

**Feature**: discovery / skipped-node-modules

## Preconditions
- A git repo exists under `node_modules/` which scan should skip.

## Steps
1. Discover git repositories in workspace.
2. Verify `node_modules` nested repo is not published.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "discovery-skipped-node-modules"
	return nil
}
```