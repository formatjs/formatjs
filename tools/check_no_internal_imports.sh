#!/usr/bin/env bash
set -euo pipefail

# Ensure no internal path aliases (e.g. #packages/) leak into bundled output.
# Checks both .js and .d.ts files. Handles both file and directory arguments.

found=0

check_file() {
  local f="$1"
  if grep -qE '#packages/' "$f" 2>/dev/null; then
    echo "FAIL: internal import '#packages/' found in $f"
    grep -n '#packages/' "$f"
    found=1
  fi
}

for arg in "$@"; do
  if [ -d "$arg" ]; then
    while IFS= read -r -d '' f; do
      check_file "$f"
    done < <(find "$arg" \( -name '*.js' -o -name '*.d.ts' \) -print0)
  elif [ -f "$arg" ]; then
    check_file "$arg"
  fi
done

# If no args given, check all .js and .d.ts files in runfiles
if [ $# -eq 0 ]; then
  while IFS= read -r -d '' f; do
    check_file "$f"
  done < <(find . \( -name '*.js' -o -name '*.d.ts' \) -print0)
fi

if [ "$found" -eq 1 ]; then
  exit 1
fi

echo "PASS: no internal imports found"
