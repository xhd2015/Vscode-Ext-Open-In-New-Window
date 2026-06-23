# Scenario

**Feature**: path-resolution

Resolves the directory passed to iTerm2 from workspace folders or home.

```go
func Setup(t *testing.T, req *Request) error {
	activeGroup = "path-resolution"
	_ = t
	_ = req
	return nil
}
```