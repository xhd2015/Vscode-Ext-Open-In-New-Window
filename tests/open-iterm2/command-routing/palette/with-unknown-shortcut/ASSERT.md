## Expected
- Palette **Open iTerm2** ignores invalid stored shortcut preference.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.Ok {
		t.Fatalf("expected ok=true, got executions=%v", resp.Executions)
	}
	expectFollowUp(t, resp.FollowUpCommands)
	expectNoGrokScript(t, resp.Script, "palette Open iTerm2")
}
```