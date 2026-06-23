# Scenario

**Feature**: menu-visibility / realpath-resource

## Preconditions
- Workspace contains a git repo under the OS temp directory.
- VS Code `resourcePath` uses the filesystem realpath spelling.

## Steps
1. Activate extension and publish discovered git repo paths.
2. Evaluate menu visibility using `fs.realpathSync(repo)` as `resourcePath`.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "menu-realpath-resource"
	return nil
}
```