## Expected
- Palette **Open iTerm2** runs cd-only when Cmd+; is also cd-only.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.Ok {
		t.Fatalf("expected ok=true, got executions=%v", resp.Executions)
	}
	expectFollowUp(t, resp.FollowUpCommands)
	expectNoFollowUpScript(t, resp.Script, "grok", "palette Open iTerm2")
}
```