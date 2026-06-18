#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

if [[ ! -f package.json ]]; then
	echo "Error: package.json not found in ${PROJECT_ROOT}" >&2
	exit 1
fi

npm install
npm run compile
npx @vscode/vsce package

NAME="$(node -p "require('./package.json').name")"
VERSION="$(node -p "require('./package.json').version")"
VSIX_PATH="${PROJECT_ROOT}/${NAME}-${VERSION}.vsix"

if [[ ! -f "${VSIX_PATH}" ]]; then
	echo "Error: VSIX not found at ${VSIX_PATH}" >&2
	exit 1
fi

if [[ -n "${OUTPUT_VSIX_PATH_RESULT:-}" ]]; then
	printf '%s\n' "${VSIX_PATH}" > "${OUTPUT_VSIX_PATH_RESULT}"
else
	echo "${VSIX_PATH}"
fi