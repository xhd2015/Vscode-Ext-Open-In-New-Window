# Scenario

**Feature**: path-escaping

AppleScript string literals must safely embed workspace paths.

```go
func Setup(t *testing.T, req *Request) error {
	activeGroup = "path-escaping"
	_ = t
	_ = req
	return nil
}
```