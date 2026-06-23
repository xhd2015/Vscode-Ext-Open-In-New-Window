# Scenario

**Feature**: path-normalization / dot-segments

## Steps
1. Normalize a path containing `.` segments.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "normalize-dot-segments"
	req.NormalizeInput = "/Users/example/ai-critic/./x"
	req.ExpectedKey = "/Users/example/ai-critic/x"
	return nil
}
```