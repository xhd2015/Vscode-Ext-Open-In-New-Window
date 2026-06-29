# Scenario

**Feature**: command-routing

```
# Extension registers palette, shortcut, and grok commands
Extension -> globalState (shortcut preference)
Extension -> openInITerm2 (palette cd-only)
Extension -> openITerm2Shortcut (Cmd+; preference)
Extension -> openITerm2Grok (always grok)
Extension -> openITerm2Codex / Claude / OpenCode / Pi (always each CLI)

# Harness activates extension and runs workflow steps
Harness -> Extension (switch-shortcut / execute commands)
Harness <- openInITerm2 (followUpCommands, script per execution)
```

Extension command dispatch for palette actions vs stored Cmd+; shortcut preference.

```go
func Setup(t *testing.T, req *Request) error {
	activeGroup = "command-routing"
	req.Scenario = "extension-workflow"
	if len(req.WorkspaceFolders) == 0 {
		req.WorkspaceFolders = []string{"/tmp/proj"}
	}
	return nil
}

func executionFor(resp *Response, commandId string) *ExecutionResult {
	for i := range resp.Executions {
		if resp.Executions[i].CommandId == commandId {
			return &resp.Executions[i]
		}
	}
	return nil
}

func expectFollowUp(t *testing.T, commands []string, want ...string) {
	if len(commands) != len(want) {
		t.Fatalf("followUpCommands=%v, want %v", commands, want)
	}
	for i := range want {
		if commands[i] != want[i] {
			t.Fatalf("followUpCommands=%v, want %v", commands, want)
		}
	}
}

func expectNoFollowUpScript(t *testing.T, script string, cli string, context string) {
	needle := `write text "` + cli + `"`
	if strings.Contains(script, needle) {
		t.Fatalf("%s script must not run %s; got %q", context, cli, script)
	}
}

func expectFollowUpScript(t *testing.T, script string, cli string, context string) {
	needle := `write text "` + cli + `"`
	if !strings.Contains(script, needle) {
		t.Fatalf("%s script must run %s; got %q", context, cli, script)
	}
}
```