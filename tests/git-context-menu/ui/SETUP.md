# Scenario

**Feature**: ui

## Preconditions
- Node.js and npm are available.
- `vscode-extension-tester` is installed (`npm install`).
- Extension compiled to `out/extension.js`.

## Steps
1. Run `npm run ui-test` (setup + real VS Code UI test via ExTester).
2. ExTester opens a workspace with nested git repo `x/` and plain folder `plain/`.
3. Right-clicks explorer folders and checks context menu visibility.

## Context
- UI runner: ExTester (`extest setup-and-run`).
- Test source: `src/ui-test/git-context-menu.test.ts`.
- Verifies actual explorer context menu shows "Git: Open Repository" (not mocked).

```go
func Setup(t *testing.T, req *Request) error {
	activeGroup = "ui"
	_ = t
	_ = req
	return nil
}
```