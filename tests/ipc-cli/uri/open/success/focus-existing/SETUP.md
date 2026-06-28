# Scenario

**Feature**: `/open` URI focuses folder already in workspace

```
# same semantics as IPC open — focus existing window
Extension onUri (/open, existing folder) -> vscode.openFolder(forceNewWindow: false)
```

## Preconditions
- Mock workspace already contains the target directory.

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "uri-open-focus-existing"
	return nil
}
```