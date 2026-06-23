## Expected
- Script creates a new window, not a tab.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.UsesCreateWindow {
		t.Fatalf("script must use create window; got %q", resp.Script)
	}
	if resp.UsesCreateTab {
		t.Fatal("script must not create a tab")
	}
	if !strings.Contains(resp.Script, `write text ("cd " & quoted form of targetDir)`) {
		t.Fatalf("script must cd via write text; got %q", resp.Script)
	}
}
```