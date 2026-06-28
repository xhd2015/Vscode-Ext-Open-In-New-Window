# Scenario

**Feature**: directory without `.git` is silently skipped (matches context-menu behavior)

```
# no .git metadata — same as gitOpenRepository command
Extension onUri handler -> isGitRepository false -> silent return
```

## Steps
1. Create a plain directory without `.git`.
2. Invoke URI handler with that path.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "uri-no-git"
	return nil
}
```