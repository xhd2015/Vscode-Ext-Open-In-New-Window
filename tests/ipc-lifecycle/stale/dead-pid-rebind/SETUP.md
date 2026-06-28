# Scenario

**Feature**: dead PID in lease triggers rebind

```
# lease pid does not exist on system
lease(pid=999999) -> Extension activate (win-rebinder) -> rebind -> ping ok
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "lifecycle-dead-pid-rebind"
	return nil
}
```