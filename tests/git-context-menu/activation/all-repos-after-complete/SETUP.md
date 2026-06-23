# Scenario

**Feature**: activation / all-repos-after-complete

## Preconditions
- Workspace contains a root git repo and a nested git repo.

## Steps
1. Call `activate()` and await completion.
2. Read `getPublishedGitRepositoryPaths()`.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "activation-all-repos-after-complete"
	return nil
}
```