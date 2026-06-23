# Scenario

**Feature**: error

User-visible errors when iTerm2 is missing or launch fails.

```go
func Setup(t *testing.T, req *Request) error {
	activeGroup = "error"
	_ = t
	_ = req
	return nil
}
```