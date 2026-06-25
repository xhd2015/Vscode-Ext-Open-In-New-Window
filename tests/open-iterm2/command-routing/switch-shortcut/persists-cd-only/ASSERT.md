## Expected
- Switch Shortcut persists cd-only and shows confirmation.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StoredShortcutActionId != "cd-only" {
		t.Fatalf("storedShortcutActionId=%q, want cd-only", resp.StoredShortcutActionId)
	}
	if !strings.Contains(resp.InformationMessage, "Cmd+; will run: Open iTerm2.") {
		t.Fatalf("informationMessage=%q, want cd-only confirmation", resp.InformationMessage)
	}
}
```