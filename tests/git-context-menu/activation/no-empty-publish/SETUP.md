# Scenario

**Feature**: activation / no-empty-publish

## Preconditions
- Workspace contains at least one discoverable git repository.

## Steps
1. Call `activate()` on a workspace with a git repo.
2. Record every `setContext(openInNewWindow.gitRepositoryPaths, ...)` publish.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "activation-no-empty-publish"
	return nil
}
```