## Expected
- After switching to Grok: palette cd-only, shortcut runs grok.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.Ok {
		t.Fatalf("expected ok=true, got executions=%v", resp.Executions)
	}
	if resp.StoredShortcutActionId != "grok" {
		t.Fatalf("storedShortcutActionId=%q, want grok", resp.StoredShortcutActionId)
	}
	palette := executionFor(resp, "open-in-new-window.openITerm2")
	if palette == nil {
		t.Fatal("missing palette execution")
	}
	shortcut := executionFor(resp, "open-in-new-window.openITerm2Shortcut")
	if shortcut == nil {
		t.Fatal("missing shortcut execution")
	}
	expectFollowUp(t, palette.FollowUpCommands)
	expectNoGrokScript(t, palette.Script, "palette after switch to grok")
	expectFollowUp(t, shortcut.FollowUpCommands, "grok")
	expectGrokScript(t, shortcut.Script, "shortcut after switch to grok")
}
```