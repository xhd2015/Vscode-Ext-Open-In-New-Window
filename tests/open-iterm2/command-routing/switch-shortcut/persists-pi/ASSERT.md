## Expected
- Switch Shortcut persists pi and shows confirmation.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StoredShortcutActionId != "pi" {
		t.Fatalf("storedShortcutActionId=%q, want pi", resp.StoredShortcutActionId)
	}
	if !strings.Contains(resp.InformationMessage, "Cmd+; will run: Open iTerm2: Pi") {
		t.Fatalf("informationMessage=%q, want Pi confirmation", resp.InformationMessage)
	}
}
```
