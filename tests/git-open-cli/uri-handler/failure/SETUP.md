# Scenario

**Feature**: URI handler rejects or skips invalid paths without opening SCM

```
# invalid input must not call git.openRepository
Extension onUri handler -> validation failure -> (error or silent skip)
```

## Context
- Missing/empty `path`, non-directory, and no-git cases must not invoke `git.openRepository`.

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```