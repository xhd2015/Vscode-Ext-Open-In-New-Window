# Scenario

**Feature**: IPC open rejects file paths

```
# file path is not a directory
Extension ipc handler (open, file.txt) -> {"ok":false,"error":"..."}
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ipc-open-not-directory"
	return nil
}
```