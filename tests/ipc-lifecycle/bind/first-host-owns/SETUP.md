# Scenario

**Feature**: first host owns socket and answers ping

```
# sole window becomes lease owner
Extension activate (win-owner) -> bind socket -> ping ok
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "lifecycle-bind-first-host"
	return nil
}
```