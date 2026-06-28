# Scenario

**Feature**: URI handler successfully opens valid git repositories

```
# valid path with .git triggers SCM open
Extension onUri handler -> openGitRepositoryAtPath -> git.openRepository
```

## Context
- Success paths require a directory containing `.git` (directory or worktree file).

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```