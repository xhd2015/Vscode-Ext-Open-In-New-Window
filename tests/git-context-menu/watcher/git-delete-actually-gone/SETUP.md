# Scenario

**Feature**: watcher / git-delete-actually-gone

## Preconditions
- Repo is in cache after activation.
- `.git` is actually removed from disk before delete handler runs.

## Steps
1. Activate extension with a git repo.
2. Delete `.git` from disk.
3. Call `handleWorkspacePathDeleted` for the `.git` path.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "watcher-git-delete-actually-gone"
	return nil
}
```