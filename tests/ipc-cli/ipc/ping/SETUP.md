# Scenario

**Feature**: IPC ping health check

```
# kool probes extension availability
kool CLI -> IPC server v2 (ping) -> {"ok":true,"version":"..."}
```

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```