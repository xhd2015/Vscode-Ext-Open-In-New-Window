# Scenario

**Feature**: discovery

## Context
- Tests git repository discovery for worktrees and skipped directories.

```go
func Setup(t *testing.T, req *Request) error {
	activeGroup = "discovery"
	_ = t
	_ = req
	return nil
}
```