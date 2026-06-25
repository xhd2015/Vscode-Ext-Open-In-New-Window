# Scenario

**Feature**: script / uses-on-error-handler

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "script-uses-on-error-handler"
	req.TestPath = "/tmp/proj"
	return nil
}
```