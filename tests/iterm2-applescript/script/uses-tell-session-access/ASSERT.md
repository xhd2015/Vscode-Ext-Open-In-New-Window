## Expected
- Session path is read via `tell aSession`, not `variable named "path" of aSession`.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.UsesTellSessionAccess {
		t.Fatalf("script must use tell aSession; got %q", resp.Script)
	}
	if resp.UsesInvalidPathAccess {
		t.Fatal("script must not use variable named \"path\" of aSession")
	}
}
```