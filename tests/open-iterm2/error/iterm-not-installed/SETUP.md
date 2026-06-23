# Scenario

**Feature**: error / iterm-not-installed

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "error-iterm-not-installed"
	req.ExistsITerm = false
	return nil
}
```