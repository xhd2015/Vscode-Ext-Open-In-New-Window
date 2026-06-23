# Implement: Git Context Menu Visibility Fix

## Context

VS Code extension "Open In New Window" shows "Git: Open Repository" in explorer context menu when:
`resourcePath in openInNewWindow.gitRepositoryPaths`

Previously fixed surfaces (now GREEN):
- Empty context published on activate before scan
- Batch-only publishing after full scan completes
- Full cache replacement overwrites watcher-added paths
- Premature removal on `.git` delete events without verifying `.git` is gone

Remaining bug (RED):
- Published git repo paths use scan `fsPath` spelling, but VS Code `resourcePath` may use
  a different canonical spelling (macOS `/private/var` vs `/var`, directory symlinks).
- Menu `when` clause exact `in` check fails → "Git: Open Repository" hidden after install.

## Feature Summary

Canonicalize git repository context keys so published paths match VS Code `resourcePath`:
- Resolve symlinks and realpath in `toGitRepositoryContextKey` (or equivalent canonicalization)
- Preserve existing behavior: incremental publish, watcher merge, path normalization (trailing slash, dot/parent segments)
- Menu visibility must pass for direct match, trailing slash, realpath resource, and symlink resource

## Test Tree (SEALED — DO NOT MODIFY)

Location: `tests/git-context-menu/`

**Tests are sealed — do not modify test files.**

Current RED state (2 failing, 16 passing among harness leaves):
- FAIL `menu-visibility/realpath-resource` — VS Code uses `/private/var/...`, published `/var/...`
- FAIL `menu-visibility/symlink-resource` — VS Code uses symlink path, published real path

All other harness leaves pass including:
- `activation/*`, `scan/*`, `refresh/*`, `watcher/*`, `path-normalization/*`, `discovery/*`
- `menu-visibility/direct-match`, `menu-visibility/trailing-slash-resource`

## Verify Command

```sh
npm run compile
doctest vet ./tests/git-context-menu
doctest test ./tests/git-context-menu
npm test
```

All 17 harness doctest leaves must PASS. Existing `src/test/*.test.ts` must not regress.

## Files to Modify

- `src/extension.ts` — canonicalize `toGitRepositoryContextKey` (primary fix)

## Do NOT Modify

- `tests/git-context-menu/**` (sealed)
- `package.json` menu definitions (unless strictly necessary)