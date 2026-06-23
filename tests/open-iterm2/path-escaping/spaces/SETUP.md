# Scenario

**Feature**: path-escaping / spaces

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "escape-spaces"
	req.TestPath = "/tmp/my proj"
	return nil
}
```