## Expected
- Cmd+; shortcut runs Codex when preference is codex.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.Ok {
		t.Fatalf("expected ok=true, got executions=%v", resp.Executions)
	}
	expectFollowUp(t, resp.FollowUpCommands, "codex")
	expectFollowUpScript(t, resp.Script, "codex", "shortcut")
}
```
