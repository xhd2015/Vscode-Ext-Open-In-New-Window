# Scenario

**Feature**: URI without `path` query parameter surfaces an error

```
# missing required query param
Extension onUri handler -> reject missing path -> no git.openRepository
```

## Steps
1. Invoke URI handler with `/git-open` and no query string.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "uri-missing-path-query"
	return nil
}
```