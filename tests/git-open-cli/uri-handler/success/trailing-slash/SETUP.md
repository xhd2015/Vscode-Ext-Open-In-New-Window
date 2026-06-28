# Scenario

**Feature**: trailing slash on repo path is stripped before open

```
# trailing slash normalized via toGitRepositoryContextKey
Extension onUri handler -> normalize path -> git.openRepository
```

## Steps
1. Create a temp git repository.
2. Invoke URI handler with `path` ending in `/`.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "uri-trailing-slash"
	return nil
}
```