#!/usr/bin/env bash
set -euo pipefail
"$1" "$2"
if "$1" "$3" > "$TEST_TMPDIR/throw.stdout" 2> "$TEST_TMPDIR/throw.stderr"; then
  echo "Expected script error" >&2
  exit 1
else
  status=$?
fi
if [[ "$status" -ne 1 ]]; then
  echo "Expected exit 1, got $status" >&2
  exit 1
fi
grep -q 'expected script error' "$TEST_TMPDIR/throw.stderr"
