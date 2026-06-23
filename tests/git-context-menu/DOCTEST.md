# Git Context Menu Visibility Tests

Doc-style tests for the `openInNewWindow.gitRepositoryPaths` context publishing
bug that hides the "Git: Open Repository" explorer menu item.

The extension publishes normalized git repo paths to VS Code context. Menu
visibility requires `resourcePath in openInNewWindow.gitRepositoryPaths`. These
tests verify activation publishing, incremental scan updates, refresh merge
behavior, watcher event handling, path normalization, discovery edge cases,
menu visibility equivalence, and resourcePath spelling mismatches.

## Version

0.0.2

## DSN (Domain Specific Notion)

### Participants
- **Extension** — `src/extension.ts`; discovers git repos, publishes paths via
  `setContext('openInNewWindow.gitRepositoryPaths', ...)`.
- **VS Code menu `when` clause** — checks `resourcePath in openInNewWindow.gitRepositoryPaths`.
- **Node harness** — `testdata/harness/run.mjs` loads compiled `out/extension.js`
  with a mocked `vscode` module and runs scenario fixtures.
- **`resourcePath`** — explorer context key; may use a different path spelling
  than scanned `fsPath` (symlinks, macOS `/private/var` vs `/var`).
- **`resourceFilename`** — explorer folder name (e.g. `x`); used by the menu
  `when` clause alongside `resourcePath`.
- **`openInNewWindow.gitRepositoryPathKeys`** — object map `{ path: true }`
  published for VS Code `in` checks (not an array of paths).

### Behaviors
- **`activate`** — scans workspace, publishes git repo paths incrementally.
- **`menuWouldShow`** — legacy simulation: `publishedPaths.includes(toGitRepositoryContextKey(resourcePath))`.
- **`menuWouldShowViaPathKeys`** — real menu contract:
  `resourcePath in pathKeys || resourceFilename in pathKeys`.
- **Path mismatch** — array-based context or missing basename aliases can hide
  the menu even though the folder is a valid git repository.

## Decision Tree

```
scenario
├── activation/
│   ├── no-empty-publish          → first publish must not be empty
│   └── all-repos-after-complete  → root + nested repos after activate
├── scan/
│   ├── incremental-before-complete → depth-0 repo published before scan ends
│   └── nested-repo-discovered      → nested repo in discovered paths
├── refresh/
│   └── watcher-survives-refresh    → watcher path survives in-flight refresh
├── watcher/
│   ├── git-delete-still-exists     → .git delete event, .git still on disk
│   ├── git-create-adds-path        → .git create adds repo to cache
│   └── git-delete-actually-gone    → .git gone removes repo from cache
├── path-normalization/
│   ├── trailing-slash              → strip trailing slash
│   ├── dot-segments                → collapse `.` segments
│   └── parent-segments             → resolve `..` segments
├── discovery/
│   ├── worktree-git-file           → `.git` file worktree discovered
│   └── skipped-node-modules        → node_modules repos skipped
├── menu-visibility/
│   ├── direct-match                → menu shows for repo directory
│   ├── trailing-slash-resource     → menu shows for trailing-slash path
│   ├── realpath-resource           → menu shows when VS Code uses realpath spelling
│   ├── symlink-resource            → menu shows when resource is a symlink to repo
│   ├── path-keys-object-map        → pathKeys published as object map with aliases
│   └── resource-filename-match     → nested x/ matches via resourceFilename in pathKeys
└── ui/
    └── explorer-menu-visible       → real VS Code UI test (ExTester)
```

## Test Index

| # | Path | Description |
|---|------|-------------|
| 1 | `activation/no-empty-publish/` | No empty context publish on activate when repos exist |
| 2 | `activation/all-repos-after-complete/` | All discoverable repos published after activate |
| 3 | `scan/incremental-before-complete/` | Depth-0 repo published before scan completes |
| 4 | `scan/nested-repo-discovered/` | Nested repo path discovered and normalized |
| 5 | `refresh/watcher-survives-refresh/` | Watcher-added path survives refresh completion |
| 6 | `watcher/git-delete-still-exists/` | Repo stays cached when `.git` delete is spurious |
| 7 | `watcher/git-create-adds-path/` | Watcher create adds new repo to cache |
| 8 | `watcher/git-delete-actually-gone/` | Repo removed when `.git` is actually deleted |
| 9 | `path-normalization/trailing-slash/` | Trailing slash normalization |
| 10 | `path-normalization/dot-segments/` | Dot segment normalization |
| 11 | `path-normalization/parent-segments/` | Parent segment normalization |
| 12 | `discovery/worktree-git-file/` | Worktree `.git` file discovery |
| 13 | `discovery/skipped-node-modules/` | `node_modules` repos excluded from scan |
| 14 | `menu-visibility/direct-match/` | Menu visibility for repo directory |
| 15 | `menu-visibility/trailing-slash-resource/` | Menu visibility with trailing slash |
| 16 | `menu-visibility/realpath-resource/` | Menu visibility when VS Code uses realpath spelling |
| 17 | `menu-visibility/symlink-resource/` | Menu visibility for symlinked git repo path |
| 18 | `menu-visibility/path-keys-object-map/` | `gitRepositoryPathKeys` published as object map |
| 19 | `menu-visibility/resource-filename-match/` | Nested `x/` matches via `resourceFilename in pathKeys` |
| 20 | `ui/explorer-menu-visible/` | Real VS Code explorer context menu (ExTester) |

## How to Run

```sh
npm run compile
doctest test ./tests/git-context-menu
npm test
npm run ui-test
```

```go
import (
	"bytes"
	"encoding/json"
	"fmt"
	"os/exec"
	"path/filepath"
	"testing"
)

type Request struct {
	Scenario       string `json:"scenario"`
	NormalizeInput string `json:"normalizeInput"`
	ExpectedKey    string `json:"expectedKey"`
}

var activeGroup string

type Response struct {
	PublishedPaths                []string   `json:"publishedPaths"`
	ContextPublishHistory         [][]string `json:"contextPublishHistory"`
	FirstPublishEmpty             bool       `json:"firstPublishEmpty"`
	Depth0PublishedBeforeComplete bool       `json:"depth0PublishedBeforeComplete"`
	AllExpectedPresent            bool       `json:"allExpectedPresent"`
	ExpectedPaths                 []string   `json:"expectedPaths"`
	WatcherPathSurvived           bool       `json:"watcherPathSurvived"`
	WatcherKey                    string     `json:"watcherKey"`
	PathInCacheAfterDelete        bool       `json:"pathInCacheAfterDelete"`
	PathAdded                     bool       `json:"pathAdded"`
	PathRemoved                   bool       `json:"pathRemoved"`
	RepoKey                       string     `json:"repoKey"`
	DiscoveredPaths               []string   `json:"discoveredPaths"`
	NormalizedKey                 string     `json:"normalizedKey"`
	NestedPresent                 bool       `json:"nestedPresent"`
	WorktreePresent               bool       `json:"worktreePresent"`
	IsGitRepository               bool       `json:"isGitRepository"`
	HiddenSkipped                 bool       `json:"hiddenSkipped"`
	MenuWouldShow                 bool       `json:"menuWouldShow"`
	ResourcePath                  string     `json:"resourcePath"`
	ResourceFilename              string     `json:"resourceFilename"`
	VscodeResourcePath            string     `json:"vscodeResourcePath"`
	PublishedKey                  string     `json:"publishedKey"`
	PublishedPathKeys             map[string]bool `json:"publishedPathKeys"`
	PathKeysIsObject              bool       `json:"pathKeysIsObject"`
	PathsContextIsArray           bool       `json:"pathsContextIsArray"`
	HasFullPathKey                bool       `json:"hasFullPathKey"`
	HasBasenameKey                bool       `json:"hasBasenameKey"`
	MenuWouldShowViaPathKeys      bool       `json:"menuWouldShowViaPathKeys"`
	MenuWouldShowViaArrayIncludes bool       `json:"menuWouldShowViaArrayIncludes"`
	RootKey                       string     `json:"rootKey"`
	ExitCode                      int        `json:"exitCode"`
	Output                        string     `json:"output"`
}

func Run(t *testing.T, req *Request) (*Response, error) {
	_ = activeGroup
	if req.Scenario == "ui-explorer-menu-visible" {
		return runUiTest(t)
	}
	harness := filepath.Join(DOCTEST_ROOT, "testdata", "harness", "run.mjs")
	payload, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}
	cmd := exec.Command("node", harness, string(payload))
	cmd.Dir = filepath.Join(DOCTEST_ROOT, "..", "..")
	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("%w\n%s", err, stderr.String())
	}
	out := stdout.Bytes()
	var resp Response
	if err := json.Unmarshal(out, &resp); err != nil {
		t.Fatalf("invalid harness output: %v\nstdout=%s\nstderr=%s", err, out, stderr.String())
	}
	return &resp, nil
}

func runUiTest(t *testing.T) (*Response, error) {
	projectRoot := filepath.Join(DOCTEST_ROOT, "..", "..")
	cmd := exec.Command("npm", "run", "ui-test")
	cmd.Dir = projectRoot
	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err := cmd.Run()
	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			return nil, err
		}
	}
	return &Response{
		ExitCode: exitCode,
		Output:   stdout.String() + stderr.String(),
	}, nil
}
```