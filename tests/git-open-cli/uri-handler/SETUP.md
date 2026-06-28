# Scenario

**Feature**: extension handles `vscode://xhd2015.open-in-new-window/git-open` URIs

```
# VS Code delivers deep link to extension onUri handler
VS Code URI router -> Extension onUri handler -> openGitRepositoryAtPath

# successful open adds repo to SCM
openGitRepositoryAtPath -> git.openRepository(normalizedPath)
```

## Context
- All scenarios in this subtree exercise the extension URI handler entry point.

```go
func Setup(t *testing.T, req *Request) error {
	_ = t
	_ = req
	return nil
}
```