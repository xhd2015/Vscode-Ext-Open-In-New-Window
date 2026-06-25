# Scenario

**Feature**: script / smart-open-branches

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "script-smart-open-branches"
	req.TestPath = "/tmp/proj"
	return nil
}
```