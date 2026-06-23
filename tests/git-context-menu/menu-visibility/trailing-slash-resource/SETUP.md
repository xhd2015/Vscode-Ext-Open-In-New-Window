# Scenario

**Feature**: menu-visibility / trailing-slash-resource

## Preconditions
- Git repo directory is published after activation.

## Steps
1. Activate extension with a git repo.
2. Evaluate menu visibility for resource path with trailing slash.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "menu-trailing-slash-resource"
	return nil
}
```