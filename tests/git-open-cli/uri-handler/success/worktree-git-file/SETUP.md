# Scenario

**Feature**: worktree with `.git` file (not directory) is accepted

```
# .git file pointing to gitdir is a valid repository
Extension onUri handler -> isGitRepository(worktree) -> git.openRepository
```

## Steps
1. Create main git repo and worktree directory with `.git` file.
2. Invoke URI handler for worktree path.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "uri-worktree-git-file"
	return nil
}
```