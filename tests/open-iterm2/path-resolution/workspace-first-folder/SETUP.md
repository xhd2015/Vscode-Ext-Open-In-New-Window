# Scenario

**Feature**: path-resolution / workspace-first-folder

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "path-workspace-first-folder"
	req.WorkspaceFolders = []string{"/tmp/proj"}
	req.Homedir = "/Users/tester"
	return nil
}
```