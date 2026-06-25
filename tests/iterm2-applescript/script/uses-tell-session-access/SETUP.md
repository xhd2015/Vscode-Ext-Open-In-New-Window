# Scenario

**Feature**: script / uses-tell-session-access

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "script-uses-tell-session-access"
	req.TestPath = "/tmp/proj"
	return nil
}
```