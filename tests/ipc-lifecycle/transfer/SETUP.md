# Scenario

**Feature**: lease transfers when owner window deactivates

```
# survivor watches lease while owner is alive
Extension activate (survivor) -> watch lease (no steal)

# owner exits — survivor rebinds
Extension deactivate (owner) -> survivor rebind -> ping ok
```

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```