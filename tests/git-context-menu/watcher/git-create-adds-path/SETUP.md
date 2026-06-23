# Scenario

**Feature**: watcher / git-create-adds-path

## Preconditions
- A new `.git` metadata path appears after activation.

## Steps
1. Activate extension.
2. Initialize a new git repo and fire `handleWorkspacePathCreated` for `.git`.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "watcher-git-create-adds-path"
	return nil
}
```