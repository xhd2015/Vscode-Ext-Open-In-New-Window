## Expected
- Switch Shortcut persists codex and shows confirmation.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StoredShortcutActionId != "codex" {
		t.Fatalf("storedShortcutActionId=%q, want codex", resp.StoredShortcutActionId)
	}
	if !strings.Contains(resp.InformationMessage, "Cmd+; will run: Open iTerm2: Codex") {
		t.Fatalf("informationMessage=%q, want Codex confirmation", resp.InformationMessage)
	}
}
```
