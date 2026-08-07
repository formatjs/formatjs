#!/bin/bash
set -euo pipefail

# Test that the extracted messages file exists and contains expected content
# In bazel tests, the file is in the runfiles tree
MESSAGES_FILE="messages.json"

if [ ! -f "$MESSAGES_FILE" ]; then
    echo "Error: Messages file not found at $MESSAGES_FILE"
    echo "Current directory: $(pwd)"
    echo "Files available:"
    ls -la
    exit 1
fi

echo "✓ Messages file exists"

# Check that the file contains expected message IDs
if ! grep -q "app.welcome" "$MESSAGES_FILE"; then
    echo "Error: app.welcome not found in messages"
    exit 1
fi

echo "✓ app.welcome message found"

if ! grep -q "app.goodbye" "$MESSAGES_FILE"; then
    echo "Error: app.goodbye not found in messages"
    exit 1
fi

echo "✓ app.goodbye message found"

if ! grep -q "app.inline" "$MESSAGES_FILE"; then
    echo "Error: app.inline not found in messages"
    exit 1
fi

echo "✓ app.inline message found"

# Count the number of messages (should be 3)
MESSAGE_COUNT=$(grep -o '"id"' "$MESSAGES_FILE" | wc -l | tr -d ' ')
if [ "$MESSAGE_COUNT" != "3" ]; then
    echo "Error: Expected 3 messages, found $MESSAGE_COUNT"
    exit 1
fi

echo "✓ All 3 messages extracted correctly"

echo ""
echo "All tests passed! Custom FormatJS CLI version (0.1.0) works correctly."
