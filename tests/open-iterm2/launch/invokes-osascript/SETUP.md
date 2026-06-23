# Scenario

**Feature**: launch / invokes-osascript

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "launch-invokes-osascript"
	req.WorkspaceFolders = []string{"/tmp/proj"}
	req.ExistsITerm = true
	return nil
}
```