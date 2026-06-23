# Scenario

**Feature**: refresh / watcher-survives-refresh

## Preconditions
- Initial scan has completed and cache is populated.
- A new repo is added via watcher while `refreshGitRepositoryPathsContext` is in flight.

## Steps
1. Activate extension and complete initial scan.
2. Start `TestExported_refreshGitRepositoryPathsContext`.
3. Add a watcher repo via `handleWorkspacePathCreated` before refresh completes.
4. Await refresh completion and inspect published paths.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "refresh-watcher-survives"
	return nil
}
```