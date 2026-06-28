# Scenario

**Feature**: stale lease triggers survivor rebind

```
# lease references dead PID or past expiresAt
stale lease.json -> Extension activate (survivor) -> rebind
```

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```