# Scenario

**Feature**: git repository path discovery and context publishing for explorer menu visibility

## Preconditions
- Node.js is available in PATH.
- The extension is compiled to `out/extension.js` (`npm run compile`).
- Tests invoke exported extension functions through a Node harness with a mocked `vscode` module.

## Steps
1. Each leaf sets `req.Scenario` and scenario-specific fields via `Setup`.
2. `Run` executes the Node harness at `testdata/harness/run.mjs` with the request JSON.
3. The harness loads `out/extension.js`, runs the scenario, and returns a JSON response.
4. Each leaf asserts outcomes via `Assert`.

## Context
- **Context key**: `openInNewWindow.gitRepositoryPaths` — normalized absolute paths published via `setContext`.
- **Cache**: in-memory `gitRepositoryPathsCache`, updated by scan, watcher, and refresh.
- **Menu visibility**: `resourcePath in openInNewWindow.gitRepositoryPathKeys || resourceFilename in openInNewWindow.gitRepositoryPathKeys`.
- **Legacy array context**: `openInNewWindow.gitRepositoryPaths` (array) kept for debug; not used by menu `when` clause.
- **Bug surfaces**: empty publish on activate, batch-only scan publish, refresh overwrite race, premature `.git` delete removal, resourcePath spelling mismatch (symlinks, macOS realpath), array-vs-object-map `in` mismatch, missing basename aliases for nested folders like `x/`.
- **Test helper**: `TestExported_refreshGitRepositoryPathsContext` must be exported for the refresh race leaf.