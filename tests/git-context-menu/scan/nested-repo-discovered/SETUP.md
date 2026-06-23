# Scenario

**Feature**: scan / nested-repo-discovered

## Preconditions
- Workspace contains nested git repo at `x/`.

## Steps
1. Run `discoverGitRepositoryPaths()`.
2. Normalize the nested repo path with `toGitRepositoryContextKey`.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "scan-nested-repo-discovered"
	return nil
}
```