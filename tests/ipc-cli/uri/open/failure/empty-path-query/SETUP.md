# Scenario

**Feature**: `/open` URI rejects empty path query

```
# empty path query value
Extension onUri (/open?path=) -> error message
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "uri-open-empty-path-query"
	return nil
}
```