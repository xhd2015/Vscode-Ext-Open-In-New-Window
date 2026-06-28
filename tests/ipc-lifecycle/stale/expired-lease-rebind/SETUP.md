# Scenario

**Feature**: expired lease triggers rebind

```
# expiresAt in the past
lease(expired) -> Extension activate (win-rebinder) -> rebind -> fresh lease
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "lifecycle-expired-lease-rebind"
	return nil
}
```