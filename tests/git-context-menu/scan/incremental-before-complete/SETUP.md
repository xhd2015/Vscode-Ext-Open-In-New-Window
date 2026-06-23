# Scenario

**Feature**: scan / incremental-before-complete

## Preconditions
- Workspace has a depth-0 git repo and a deeper nested git repo behind filler directories.

## Steps
1. Start `activate()` without awaiting.
2. Poll context publishes until the depth-0 repo path appears or activation completes.
3. Assert depth-0 path was published before `activate()` resolves.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "scan-incremental-before-complete"
	return nil
}
```