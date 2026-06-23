## Expected
- `openInITerm2` invokes `osascript` with the built script.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.Ok {
		t.Fatalf("expected ok=true, got error=%q", resp.Error)
	}
	if !resp.ExecFileCalled {
		t.Fatal("execFile must be called")
	}
	if resp.ExecFileCommand != "osascript" {
		t.Fatalf("execFile command=%q, want osascript", resp.ExecFileCommand)
	}
	if len(resp.ExecFileArgv) < 2 || resp.ExecFileArgv[0] != "-e" {
		t.Fatalf("execFile argv=%v, want [-e, script]", resp.ExecFileArgv)
	}
}
```