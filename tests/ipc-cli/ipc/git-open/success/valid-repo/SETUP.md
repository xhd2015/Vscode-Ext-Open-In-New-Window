# Scenario

**Feature**: open valid git repo via IPC

```
# valid repo path opens SCM view
Extension ipc handler (git-open, /abs/repo) -> git.openRepository(normalizedPath)
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ipc-git-open-valid-repo"
	return nil
}
```