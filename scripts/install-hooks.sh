#!/usr/bin/env bash
# Install the pre-commit framework hooks into .git/hooks.
set -euo pipefail
command -v pre-commit >/dev/null || { echo "pre-commit not found: pipx install pre-commit" >&2; exit 1; }
# pre-commit refuses to install while core.hooksPath is set. A global hooksPath
# shim that chains to .git/hooks/pre-commit still runs these hooks.
if git config core.hooksPath >/dev/null; then
  GIT_CONFIG_GLOBAL=/dev/null pre-commit install
else
  pre-commit install
fi
