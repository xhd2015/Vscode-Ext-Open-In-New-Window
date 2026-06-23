# Scenario

**Feature**: path-resolution / multi-root-uses-first

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "path-multi-root-uses-first"
	req.WorkspaceFolders = []string{"/workspace/a", "/workspace/b"}
	req.Homedir = "/Users/tester"
	return nil
}
```