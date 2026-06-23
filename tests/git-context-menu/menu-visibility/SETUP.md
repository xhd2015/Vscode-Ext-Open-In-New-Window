# Scenario

**Feature**: menu-visibility

## Context
- Tests menu visibility equivalence: `publishedPaths.includes(toGitRepositoryContextKey(resource.fsPath))`.

```go
func Setup(t *testing.T, req *Request) error {
	activeGroup = "menu-visibility"
	_ = t
	_ = req
	return nil
}
```