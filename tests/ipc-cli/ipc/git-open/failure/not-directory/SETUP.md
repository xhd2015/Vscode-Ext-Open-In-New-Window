# Scenario

**Feature**: IPC git-open rejects file paths

```
# file path surfaces error
Extension ipc handler (git-open, file.txt) -> {"ok":false,"error":"..."}
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "ipc-git-open-not-directory"
	return nil
}
```