# Scenario

**Feature**: error / osascript-failure

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "error-osascript-failure"
	req.ExistsITerm = true
	req.ExecFileError = "osascript: execution error"
	return nil
}
```