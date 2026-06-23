# Scenario

**Feature**: menu-visibility / resource-filename-match

## Preconditions
- Workspace root and nested `x/` are both git repositories (ai-critic-like layout).

## Steps
1. Activate extension and publish git path context.
2. Evaluate the real menu `when` contract:
   `resourcePath in openInNewWindow.gitRepositoryPathKeys || resourceFilename in openInNewWindow.gitRepositoryPathKeys`
   using `resourceFilename = "x"`.
3. Compare against the legacy harness simulation `publishedPaths.includes(toGitRepositoryContextKey("x"))`.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "menu-resource-filename-match"
	return nil
}
```