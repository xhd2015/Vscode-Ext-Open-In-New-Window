# Scenario

**Feature**: watcher

## Context
- Tests filesystem watcher create/delete handling for git metadata and repo directories.

```go
func Setup(t *testing.T, req *Request) error {
	activeGroup = "watcher"
	_ = t
	_ = req
	return nil
}
```