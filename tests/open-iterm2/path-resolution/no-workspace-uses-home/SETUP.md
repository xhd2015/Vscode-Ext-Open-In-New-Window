# Scenario

**Feature**: path-resolution / no-workspace-uses-home

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "path-no-workspace-uses-home"
	req.WorkspaceFolders = nil
	req.Homedir = "/Users/tester"
	return nil
}
```