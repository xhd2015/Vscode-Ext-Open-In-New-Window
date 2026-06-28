# Scenario

**Feature**: `/open` URI rejects file paths

```
# file path surfaces error
Extension onUri (/open?path=file.txt) -> error message
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "uri-open-not-directory"
	return nil
}
```