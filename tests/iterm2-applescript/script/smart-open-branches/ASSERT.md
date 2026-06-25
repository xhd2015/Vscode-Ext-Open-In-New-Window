## Expected
- Smart open script scans paths, supports tab reuse, and falls back to a new window.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.UsesPathScan {
		t.Fatalf("script must scan session paths; got %q", resp.Script)
	}
	if !resp.UsesCreateTab {
		t.Fatalf("script must create a tab when a window matches; got %q", resp.Script)
	}
	if !resp.UsesCreateWindow {
		t.Fatalf("script must fall back to create window; got %q", resp.Script)
	}
	if !strings.Contains(resp.Script, `write text ("cd " & quoted form of targetDir)`) {
		t.Fatalf("script must cd via write text; got %q", resp.Script)
	}
}
```