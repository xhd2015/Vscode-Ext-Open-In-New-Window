# Scenario

**Feature**: Open iTerm2 command — path resolution, AppleScript generation, and launch behavior

## Preconditions
- Node.js is available in PATH.
- The extension is compiled to `out/iterm2.js` (`npm run compile`).
- Tests invoke exported functions through a Node harness with mocked filesystem and `execFile`.

## Steps
1. Each leaf sets `req.Scenario` and scenario-specific fields via `Setup`.
2. `Run` executes the Node harness at `testdata/harness/run.mjs` with the request JSON.
3. The harness loads `out/iterm2.js`, runs the scenario, and returns a JSON response.
4. Each leaf asserts outcomes via `Assert`.

## Context
- **Target directory**: first workspace folder, or home when no workspace is open.
- **Launch**: AppleScript via `osascript`, reusing a matching iTerm2 window via new tab or creating a new window with `cd`.
- **Errors**: show message when iTerm2 is not installed or `osascript` fails.