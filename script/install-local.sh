#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CODE_CMD="${CODE_CMD:-code}"

VSIX_RESULT_FILE="$(mktemp)"
trap 'rm -f "${VSIX_RESULT_FILE}"' EXIT

OUTPUT_VSIX_PATH_RESULT="${VSIX_RESULT_FILE}" "${SCRIPT_DIR}/bundle.sh"

if [[ ! -s "${VSIX_RESULT_FILE}" ]]; then
	echo "Error: bundle.sh did not write VSIX path to ${VSIX_RESULT_FILE}" >&2
	exit 1
fi

read -r VSIX_PATH < "${VSIX_RESULT_FILE}"

if [[ ! -f "${VSIX_PATH}" ]]; then
	echo "Error: VSIX not found at ${VSIX_PATH}" >&2
	exit 1
fi

if ! command -v "${CODE_CMD}" >/dev/null 2>&1; then
	echo "Error: ${CODE_CMD} not found in PATH" >&2
	exit 1
fi

"${CODE_CMD}" --install-extension "${VSIX_PATH}"

echo "Installed ${VSIX_PATH} with ${CODE_CMD}"