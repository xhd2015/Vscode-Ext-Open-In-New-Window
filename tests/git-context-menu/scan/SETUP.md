# Scenario

**Feature**: scan

## Context
- Tests incremental git path publishing during workspace scan.

```go
func Setup(t *testing.T, req *Request) error {
	activeGroup = "scan"
	_ = t
	_ = req
	return nil
}
```