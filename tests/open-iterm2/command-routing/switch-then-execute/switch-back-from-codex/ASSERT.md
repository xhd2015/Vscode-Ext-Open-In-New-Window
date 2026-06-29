## Expected
- After switching back from Codex: both palette and shortcut are cd-only.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.Ok {
		t.Fatalf("expected ok=true, got executions=%v", resp.Executions)
	}
	if resp.StoredShortcutActionId != "cd-only" {
		t.Fatalf("storedShortcutActionId=%q, want cd-only", resp.StoredShortcutActionId)
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
	expectNoFollowUpScript(t, palette.Script, "codex", "palette after switch back from codex")
	expectFollowUp(t, shortcut.FollowUpCommands)
	expectNoFollowUpScript(t, shortcut.Script, "codex", "shortcut after switch back from codex")
}
```