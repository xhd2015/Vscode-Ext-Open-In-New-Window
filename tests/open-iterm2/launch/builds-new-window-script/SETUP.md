# Scenario

**Feature**: launch / builds-new-window-script

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "launch-builds-new-window-script"
	req.TestPath = "/tmp/proj"
	return nil
}
```