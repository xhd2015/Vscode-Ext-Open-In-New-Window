# Scenario

**Feature**: path-normalization / parent-segments

## Steps
1. Normalize a path containing `..` segments.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "normalize-parent-segments"
	req.NormalizeInput = "/Users/example/ai-critic/nested/../x"
	req.ExpectedKey = "/Users/example/ai-critic/x"
	return nil
}
```