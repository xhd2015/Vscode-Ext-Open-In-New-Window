# Scenario

**Feature**: directory without .git is silently skipped

```
# no-git matches URI and context-menu behavior
Extension ipc handler (git-open, plain-dir) -> silent skip
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ipc-git-open-no-git"
	return nil
}
```