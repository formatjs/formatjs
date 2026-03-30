#!/usr/bin/env bash
set -euo pipefail

# Ensure no internal path aliases (e.g. #packages/) leak into bundled JS output.
# This runs against esbuild bundle output to catch misconfigured externals.

found=0
for f in "$@"; do
  if grep -qE '#packages/' "$f" 2>/dev/null; then
    echo "FAIL: internal import '#packages/' found in $f"
    grep -n '#packages/' "$f"
    found=1
  fi
done

# If no args given, check all .js files in runfiles
if [ $# -eq 0 ]; then
  while IFS= read -r -d '' f; do
    if grep -qE '#packages/' "$f" 2>/dev/null; then
      echo "FAIL: internal import '#packages/' found in $f"
      grep -n '#packages/' "$f"
      found=1
    fi
  done < <(find . -name '*.js' -print0)
fi

if [ "$found" -eq 1 ]; then
  exit 1
fi

echo "PASS: no internal imports found"
