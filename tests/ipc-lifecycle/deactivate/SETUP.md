# Scenario

**Feature**: owner deactivate releases socket and lease

```
# clean shutdown on extension deactivate
Extension deactivate (owner) -> stop server -> unlink socket -> clear lease
```

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```