# Scenario

**Feature**: live

Optional live `osascript` checks against the installed iTerm2 app.

```go
func Setup(t *testing.T, req *Request) error {
	activeGroup = "live"
	_ = t
	_ = req
	return nil
}
```