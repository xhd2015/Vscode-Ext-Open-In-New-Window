# Scenario

**Feature**: path-resolution / normalize-existing-path

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "path-normalize-existing"
	req.TestPath = "/tmp/proj"
	req.PathExists = true
	req.RealPath = "/private/tmp/proj"
	return nil
}
```