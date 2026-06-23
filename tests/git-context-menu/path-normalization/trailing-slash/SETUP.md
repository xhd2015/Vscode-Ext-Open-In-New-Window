# Scenario

**Feature**: path-normalization / trailing-slash

## Steps
1. Normalize a path with a trailing slash.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "normalize-trailing-slash"
	req.NormalizeInput = "/Users/example/ai-critic/x/"
	req.ExpectedKey = "/Users/example/ai-critic/x"
	return nil
}
```