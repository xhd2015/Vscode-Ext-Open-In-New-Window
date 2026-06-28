# Scenario

**Feature**: URI pointing at a file (not directory) surfaces an error

```
# file path fails directory check
Extension onUri handler -> stat path -> reject non-directory
```

## Steps
1. Create a regular file (not a directory).
2. Invoke URI handler with that file path.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "uri-not-directory"
	return nil
}
```