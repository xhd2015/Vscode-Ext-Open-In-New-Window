# Scenario

**Feature**: survivor rebinds after owner deactivate

```
# two windows; owner leaves; survivor takes socket
win-owner deactivate -> win-survivor rebind -> ping ok
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "lifecycle-transfer-rebind"
	return nil
}
```