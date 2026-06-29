## Expected
- After switching to Codex: palette cd-only, shortcut runs codex.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.Ok {
		t.Fatalf("expected ok=true, got executions=%v", resp.Executions)
	}
	if resp.StoredShortcutActionId != "codex" {
		t.Fatalf("storedShortcutActionId=%q, want codex", resp.StoredShortcutActionId)
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
	expectNoFollowUpScript(t, palette.Script, "codex", "palette after switch to codex")
	expectFollowUp(t, shortcut.FollowUpCommands, "codex")
	expectFollowUpScript(t, shortcut.Script, "codex", "shortcut after switch to codex")
}
```