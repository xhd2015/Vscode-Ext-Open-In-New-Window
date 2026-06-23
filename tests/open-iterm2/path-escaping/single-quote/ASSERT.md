## Expected
- Single quotes in paths are escaped for AppleScript.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.EscapedPath != "/tmp/O'Brien" {
		t.Fatalf("escapedPath=%q, want /tmp/O'Brien", resp.EscapedPath)
	}
	if !strings.Contains(resp.Script, `set targetDir to "/tmp/O'Brien"`) {
		t.Fatalf("script missing targetDir with single quote; got %q", resp.Script)
	}
	if !strings.Contains(resp.Script, `write text ("cd " & quoted form of targetDir)`) {
		t.Fatalf("script must cd via quoted form of targetDir; got %q", resp.Script)
	}
}
```