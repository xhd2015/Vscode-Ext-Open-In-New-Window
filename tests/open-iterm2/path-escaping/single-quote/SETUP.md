# Scenario

**Feature**: path-escaping / single-quote

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "escape-single-quote"
	req.TestPath = "/tmp/O'Brien"
	return nil
}
```