# Scenario

**Feature**: refresh

## Context
- Tests refresh completion merging watcher-added paths instead of overwriting them.

```go
func Setup(t *testing.T, req *Request) error {
	activeGroup = "refresh"
	_ = t
	_ = req
	return nil
}
```