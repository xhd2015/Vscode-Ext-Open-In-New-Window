# Scenario

**Feature**: URI with empty `path` query value surfaces an error

```
# empty path is invalid
Extension onUri handler -> reject empty path -> no git.openRepository
```

## Steps
1. Invoke URI handler with `?path=` (empty value).

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "uri-empty-path-query"
	return nil
}
```