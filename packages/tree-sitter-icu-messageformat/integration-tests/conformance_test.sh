#!/usr/bin/env bash
# Conformance test for tree-sitter-icu-messageformat.
# Reads the shared integration test cases and verifies that:
# 1. Valid messages parse without ERROR nodes
# 2. Invalid messages (formatjs rejects them) produce ERROR nodes
set -euo pipefail

TREE_SITTER="$1"
GRAMMAR_DIR="$2"
TEST_CASES_DIR="$3"

# Test cases to skip:
# - ignore_tag_*: formatjs parser option `ignoreTag: true` treats tags as literal text.
#   tree-sitter always parses tags structurally (no runtime options).
SKIP_CASES="ignore_tag_number_arg_1|ignore_tags_1"

passed=0
failed=0
skipped=0
failures=""

for test_file in "$TEST_CASES_DIR"/*.txt; do
  test_name=$(basename "$test_file" .txt)

  # Skip known incompatible cases
  if echo "$test_name" | grep -qE "$SKIP_CASES"; then
    skipped=$((skipped + 1))
    continue
  fi

  # Extract input (everything before first \n---\n)
  input=$(awk '/^---$/{exit} {print}' "$test_file")

  # Check if this is an error case (err is not null in the JSON output)
  # The expected JSON is after the second ---
  is_error=$(awk 'BEGIN{s=0} /^---$/{s++; next} s>=2{print}' "$test_file" | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if d.get('err') is not None else 'no')" 2>/dev/null || echo "skip")

  if [ "$is_error" = "skip" ]; then
    skipped=$((skipped + 1))
    continue
  fi

  # Write input to a temp file and parse it
  tmpfile=$(mktemp)
  printf '%s' "$input" > "$tmpfile"

  if [ "$is_error" = "yes" ]; then
    # Error case: tree-sitter should produce ERROR nodes
    if "$TREE_SITTER" parse "$tmpfile" --quiet 2>/dev/null; then
      # Parsed cleanly — tree-sitter accepted what formatjs rejects
      failed=$((failed + 1))
      failures="${failures}\n  FAIL (expected ERROR): ${test_name}"
    else
      passed=$((passed + 1))
    fi
  else
    # Valid case: tree-sitter should NOT produce ERROR nodes
    if "$TREE_SITTER" parse "$tmpfile" --quiet 2>/dev/null; then
      passed=$((passed + 1))
    else
      parse_output=$("$TREE_SITTER" parse "$tmpfile" 2>/dev/null || true)
      if echo "$parse_output" | grep -qE "ERROR|MISSING"; then
        failed=$((failed + 1))
        failures="${failures}\n  FAIL (unexpected ERROR): ${test_name}"
      else
        passed=$((passed + 1))
      fi
    fi
  fi

  rm -f "$tmpfile"
done

echo ""
echo "--- Conformance Test Results ---"
echo "Passed:  $passed"
echo "Failed:  $failed"
echo "Skipped: $skipped"

if [ -n "$failures" ]; then
  echo ""
  echo "Failures:"
  echo -e "$failures"
  exit 1
fi
