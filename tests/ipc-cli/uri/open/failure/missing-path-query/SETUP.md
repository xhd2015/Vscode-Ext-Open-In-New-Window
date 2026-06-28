# Scenario

**Feature**: `/open` URI requires path query parameter

```
# missing path query
Extension onUri (/open) -> error message
```

```go
func Setup(t *testing.T, req *Request) error {
	req.Scenario = "uri-open-missing-path-query"
	return nil
}
```