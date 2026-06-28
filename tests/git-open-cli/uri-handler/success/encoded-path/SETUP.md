# Scenario

**Feature**: percent-encoded path in URI query is decoded before open

```
# URL-encoded spaces/special chars decoded
Extension onUri handler -> decode path query -> git.openRepository
```

## Steps
1. Create a git repo in a directory whose path requires URL encoding.
2. Invoke URI handler with encoded `path` query value.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "uri-encoded-path"
	return nil
}
```