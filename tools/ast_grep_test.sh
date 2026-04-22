#!/usr/bin/env bash
# ast-grep pattern assertion test.
# Usage: ast_grep_test.sh <sg_binary> <lang> <pattern> <path>...
set -euo pipefail

SG="$1"; shift
LANG="$1"; shift
PATTERN="$1"; shift

for path in "$@"; do
  if ! "$SG" run --pattern "$PATTERN" --lang "$LANG" --follow "$path"; then
    echo "FAIL: pattern '$PATTERN' not found in $path"
    exit 1
  fi
done

echo "PASS: pattern '$PATTERN' found in all targets"
