# Requirement: Git Context Menu Visibility Fix

## Bug Summary

The "Git: Open Repository" explorer context menu item (added in HEAD commit `b0a14bd`) does not always appear when right-clicking a directory that contains a `.git` folder/file.

Menu visibility condition (`package.json`):
```
explorerResourceIsFolder && resourceScheme == file && resourcePath in openInNewWindow.gitRepositoryPaths
```

The extension publishes discovered git repo paths to VS Code context key `openInNewWindow.gitRepositoryPaths`. When the right-clicked folder's `resourcePath` is absent from that array, the menu is hidden even though the directory is a valid git repository.

## Reproduction (Confirmed)

### Scenario A — Empty context during initial scan (primary)
1. Open a large workspace (e.g. `/Users/xhd2015/Projects/xhd2015/ai-critic`) with nested git repo at `x/`.
2. Extension activates and immediately publishes **0 paths** to context.
3. Full-tree `discoverGitRepositoryPaths()` scan takes 12–30+ seconds on large workspaces.
4. Right-click any git repo folder (including workspace root or `x/`) **before scan completes** → menu missing.
5. After scan completes and context is republished → menu appears.

### Scenario B — Cache overwrite race
1. Watcher incrementally adds a repo via `updateGitRepositoryPath`.
2. An in-flight `refreshGitRepositoryPathsContext` completes and **replaces** entire cache with a stale scan snapshot that omits the watcher-added path.
3. Menu disappears until next rescan (~5s debounce + full scan).

### Scenario C — Premature removal on `.git` delete event
1. Filesystem delete event fires on `.git` (git operations, tooling).
2. `handleWorkspacePathDeleted` removes repo from cache immediately.
3. Menu hidden until debounced rescan completes, even if `.git` still exists.

## Root Causes

1. **Empty context published on activate** before any repos are discovered (`initializeGitRepositoryContext` lines 95–96).
2. **Batch-only publishing** — paths published only after entire `discoverGitRepositoryPaths()` completes, not incrementally during scan.
3. **Full cache replacement** on refresh overwrites incremental watcher updates without merge.
4. **Path normalization** (`toGitRepositoryContextKey`) may not match VS Code `resourcePath` for symlinks/alternate spellings (secondary).

## Data Model

- **Context key**: `openInNewWindow.gitRepositoryPaths` — `string[]` of normalized absolute filesystem paths.
- **Cache**: in-memory `gitRepositoryPathsCache: string[]`, mutated by scan, watcher, and refresh.
- **Normalization**: `toGitRepositoryContextKey(fsPath)` — `path.normalize` + strip trailing slashes.
- **Discovery**: recursive `scanForGitRepositories` from each workspace folder, depth ≤ 12, skips `node_modules`, `.git`, etc.

## Fix Requirements

1. Do **not** publish an empty git paths context on activate (or defer until first repo found).
2. Publish git repo paths **incrementally** as they are discovered during scan (at minimum: publish each repo as soon as found).
3. When `refreshGitRepositoryPathsContext` completes, **merge** with any paths added by watchers during the scan (do not blindly replace and lose incremental updates).
4. On `.git` delete events, verify repo is actually gone before removing from cache (or rescan immediately without debounce for that path).
5. Preserve existing behavior: nested repos, worktree `.git` files, path normalization, debounced rescan for bulk changes.

## Test Scenarios (Expected Outputs)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | After `activate()` returns, published paths include all discoverable repos in workspace | `getPublishedGitRepositoryPaths()` contains workspace root and nested repos |
| 2 | During simulated slow scan, repo found at depth 0 is published before depth-1 repos | Context updated incrementally; depth-0 path present before scan promise resolves |
| 3 | Watcher adds repo while refresh in flight | Watcher-added path survives refresh completion |
| 4 | `.git` delete event followed by `.git` still existing | Path not removed from cache (or quickly restored) |
| 5 | Nested repo `ai-critic/x` in workspace `ai-critic` | Normalized path in published context |
| 6 | `toGitRepositoryContextKey` handles trailing slash, `..`, `.` segments | Matches menu `resourcePath` contract |
| 7 | Worktree with `.git` file (not directory) | Repo discovered and keyed correctly |
| 8 | `menuWouldShow(resource)` equivalent: `publishedPaths.includes(toGitRepositoryContextKey(resource.fsPath))` | True for all git repo directories |

## How to Test

- **Doc-style tests** under `tests/git-context-menu/` with `Run(t, req)` calling exported extension functions.
- **Integration tests** using `@vscode/test-electron` with workspace `/Users/xhd2015/Projects/xhd2015/ai-critic` (existing `.vscode-test.mjs` config).
- **Verify command**: `doctest test ./tests/git-context-menu` then `npm test`.

## Out of Scope

- Changing menu `when` clause to runtime command check (keep context-based approach).
- Adding new user-facing commands beyond bug fix.
- Windows-specific path testing (nice-to-have, not blocking).

## Approval

User requested reproduce + fix via `/doc-style-test-based-tdd`. Proceeding with TDD workflow.