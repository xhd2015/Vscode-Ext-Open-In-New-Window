# Scenario

**Feature**: activation

## Context
- Tests extension activation and initial git path context publishing.

```go
func Setup(t *testing.T, req *Request) error {
	activeGroup = "activation"
	_ = t
	_ = req
	return nil
}
```