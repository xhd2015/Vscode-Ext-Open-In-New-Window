## Expected
- Cmd+; shortcut runs Grok when preference is Grok.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.Ok {
		t.Fatalf("expected ok=true, got executions=%v", resp.Executions)
	}
	expectFollowUp(t, resp.FollowUpCommands, "grok")
	expectGrokScript(t, resp.Script, "shortcut")
}
```