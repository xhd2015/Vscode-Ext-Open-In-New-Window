## Expected
- Switch Shortcut persists opencode and shows confirmation.

```go
func Assert(t *testing.T, req *Request, resp *Response, err error) {
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StoredShortcutActionId != "opencode" {
		t.Fatalf("storedShortcutActionId=%q, want opencode", resp.StoredShortcutActionId)
	}
	if !strings.Contains(resp.InformationMessage, "Cmd+; will run: Open iTerm2: OpenCode") {
		t.Fatalf("informationMessage=%q, want OpenCode confirmation", resp.InformationMessage)
	}
}
```
