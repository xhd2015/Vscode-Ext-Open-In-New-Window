## Expected
- Cmd+; shortcut runs Claude Code when preference is claude.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.Ok {
		t.Fatalf("expected ok=true, got executions=%v", resp.Executions)
	}
	expectFollowUp(t, resp.FollowUpCommands, "claude")
	expectFollowUpScript(t, resp.Script, "claude", "shortcut")
}
```
