# Scenario

**Feature**: first activated window binds IPC socket and lease

```
# empty kool dir — first host claims ownership
Extension activate (first) -> IPC server v2 + lease.json
```

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```