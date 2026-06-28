# Scenario

**Feature**: IPC `git-open` operation opens git repositories in SCM

```
# git-open reuses openGitRepositoryAtPath
Extension ipc handler (git-open) -> openGitRepositoryAtPath -> git.openRepository
```

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```