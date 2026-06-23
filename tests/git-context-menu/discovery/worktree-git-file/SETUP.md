# Scenario

**Feature**: discovery / worktree-git-file

## Preconditions
- Worktree directory contains a `.git` file (not directory) pointing at a gitdir.

## Steps
1. Discover git repositories in workspace.
2. Verify worktree path is keyed and `isGitRepository` returns true.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "discovery-worktree-git-file"
	return nil
}
```