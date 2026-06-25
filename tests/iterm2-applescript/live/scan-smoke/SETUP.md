# Scenario

**Feature**: live / scan-smoke

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "live-scan-smoke"
	return nil
}
```