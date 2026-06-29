## Expected
- Switch Shortcut persists claude and shows confirmation.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StoredShortcutActionId != "claude" {
		t.Fatalf("storedShortcutActionId=%q, want claude", resp.StoredShortcutActionId)
	}
	if !strings.Contains(resp.InformationMessage, "Cmd+; will run: Open iTerm2: Claude Code") {
		t.Fatalf("informationMessage=%q, want Claude Code confirmation", resp.InformationMessage)
	}
}
```
