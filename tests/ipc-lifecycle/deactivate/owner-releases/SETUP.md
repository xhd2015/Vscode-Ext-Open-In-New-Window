# Scenario

**Feature**: deactivate removes socket and clears lease

```
# sole owner shuts down IPC cleanly
Extension deactivate (win-owner) -> socket gone, lease gone
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "lifecycle-deactivate-release"
	return nil
}
```