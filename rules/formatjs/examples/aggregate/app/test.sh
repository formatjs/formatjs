#!/bin/bash
# Test script for message aggregation
# This script verifies that the aggregated messages contain all expected messages from all modules

set -euo pipefail

# Get the aggregated messages file
AGGREGATED_FILE="$1"

if [ ! -f "$AGGREGATED_FILE" ]; then
  echo "ERROR: Aggregated messages file not found: $AGGREGATED_FILE"
  exit 1
fi

echo "Testing aggregated messages file: $AGGREGATED_FILE"

# Check that the file is valid JSON
if ! jq empty "$AGGREGATED_FILE" 2>/dev/null; then
  echo "ERROR: File is not valid JSON"
  exit 1
fi

# Expected message IDs from all modules
EXPECTED_IDS=(
  "module1.title"
  "module1.description"
  "module2.title"
  "module2.description"
  "module3.title"
  "module3.description"
  "common.save"
  "common.cancel"
)

# Check that all expected message IDs exist
for id in "${EXPECTED_IDS[@]}"; do
  if ! jq -e ".[\"$id\"]" "$AGGREGATED_FILE" >/dev/null 2>&1; then
    echo "ERROR: Expected message ID not found: $id"
    exit 1
  fi
  echo "✓ Found message: $id"
done

# Count total messages
TOTAL_COUNT=$(jq 'length' "$AGGREGATED_FILE")
EXPECTED_COUNT=${#EXPECTED_IDS[@]}

echo ""
echo "Summary:"
echo "  Expected messages: $EXPECTED_COUNT"
echo "  Found messages: $TOTAL_COUNT"

if [ "$TOTAL_COUNT" -ne "$EXPECTED_COUNT" ]; then
  echo "ERROR: Message count mismatch!"
  exit 1
fi

echo ""
echo "✓ All tests passed!"
