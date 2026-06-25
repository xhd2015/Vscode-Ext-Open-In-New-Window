# Git context integration fixture

Portable workspace for `@vscode/test-electron` git-context integration tests.

Layout:

- workspace root — git repository
- `x/` — nested git repository

Repositories are created by `script/prepare-git-context-fixture.mjs` during `npm test` pretest.