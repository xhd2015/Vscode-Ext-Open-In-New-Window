# Scenario

**Feature**: path-normalization

## Context
- Tests `toGitRepositoryContextKey` normalization for menu `resourcePath` matching.

```go
func Setup(t *testing.T, req *Request) error {
	activeGroup = "path-normalization"
	_ = t
	_ = req
	return nil
}
```