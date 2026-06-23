# Scenario

**Feature**: ui

ExTester verifies command palette visibility and execution.

```go
func Setup(t *testing.T, req *Request) error {
	activeGroup = "ui"
	_ = t
	_ = req
	return nil
}
```