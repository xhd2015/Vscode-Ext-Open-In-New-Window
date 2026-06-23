## Expected
- Path with spaces is embedded in the AppleScript `cd` command.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.Contains(resp.Script, `set targetDir to "/tmp/my proj"`) {
		t.Fatalf("script missing targetDir with spaces; got %q", resp.Script)
	}
	if !strings.Contains(resp.Script, `write text ("cd " & quoted form of targetDir)`) {
		t.Fatalf("script must cd via quoted form of targetDir; got %q", resp.Script)
	}
}
```