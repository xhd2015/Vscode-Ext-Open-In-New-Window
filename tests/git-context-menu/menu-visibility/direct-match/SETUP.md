# Scenario

**Feature**: menu-visibility / direct-match

## Preconditions
- Git repo directory is published after activation.

## Steps
1. Activate extension with a git repo.
2. Evaluate menu visibility for the repo directory path.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "menu-direct-match"
	return nil
}
```