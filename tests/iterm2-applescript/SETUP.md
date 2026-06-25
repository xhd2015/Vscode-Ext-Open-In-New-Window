# Scenario

**Feature**: iTerm2 AppleScript generation and live osascript smoke checks

## Preconditions
- Node.js is available in PATH.
- The extension is compiled to `out/iterm2.js` (`npm run compile`).
- Live leaves skip automatically when not on macOS or when iTerm2 is not installed.

## Steps
1. Each leaf sets `req.Scenario` and scenario-specific fields via `Setup`.
2. `Run` executes the Node harness at `testdata/harness/run.mjs` with the request JSON.
3. The harness loads `out/iterm2.js`, runs the scenario, and returns a JSON response.
4. Each leaf asserts outcomes via `Assert`.

## Context
- **Script generation** — smart open script scans session paths, reuses windows via tabs, and falls back to new windows.
- **Path access** — session `path` must be read inside `tell aSession`; `variable named "path" of aSession` is invalid.
- **Live smoke** — optional `osascript` run against the installed iTerm2 app.