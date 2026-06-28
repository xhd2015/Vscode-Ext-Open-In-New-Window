# Scenario

**Feature**: valid absolute git repo path opens via URI

```
# decoded path passes validation
Extension onUri handler -> openGitRepositoryAtPath(validRepo) -> git.openRepository
```

## Steps
1. Create a temp git repository.
2. Invoke URI handler with `?path=<absolute-repo-path>`.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "uri-valid-path"
	return nil
}
```