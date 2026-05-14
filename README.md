# Open In New Window

Adds an **Open in New Window** item to the VS Code explorer context menu.

## Features

- Right-click a folder to open that folder in a VS Code window.
- Right-click a file to open its parent folder in a VS Code window.
- If the target folder is already open, VS Code focuses the existing window.

## Development

```sh
npm install
npm run compile
```

Press `F5` in VS Code to launch an Extension Development Host.

## Local Install

Package and install the extension locally without publishing it to the Marketplace:

```sh
npm install
npm run compile
npx @vscode/vsce package
code --install-extension open-in-new-window-0.0.1.vsix
```

Reload VS Code after installing:

```sh
code --reuse-window .
```

You can also run **Developer: Reload Window** from the Command Palette.
