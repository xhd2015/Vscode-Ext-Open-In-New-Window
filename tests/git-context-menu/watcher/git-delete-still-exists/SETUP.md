# Scenario

**Feature**: watcher / git-delete-still-exists

## Preconditions
- Repo is in cache after activation.
- `.git` delete event fires but `.git` still exists on disk.

## Steps
1. Activate extension with a git repo.
2. Call `handleWorkspacePathDeleted` for the `.git` path without deleting `.git` from disk.
3. Inspect published paths.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "watcher-git-delete-still-exists"
	return nil
}
```