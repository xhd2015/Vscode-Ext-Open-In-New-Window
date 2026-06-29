# Scenario

**Feature**: command-routing / shortcut / with-pi-shortcut

Cmd+; is configured for Pi; shortcut command must run pi.

```go
func Setup(t *testing.T, req *Request) error {
	req.ShortcutActionId = "pi"
	req.CommandId = "open-in-new-window.openITerm2Shortcut"
	return nil
}
```
