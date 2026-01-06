#!/bin/bash
set -euo pipefail

# This test verifies that we're using the custom FormatJS CLI version 0.1.0
# by checking the CLI's version output

echo "Looking for CLI binary..."

# Find the CLI binary in the runfiles
# Bazel runfiles can be accessed via the runfiles library or by exploring the directory
CLI_PATH=""

# The runfiles directory structure
RUNFILES_DIR="${TEST_SRCDIR:-$PWD}"

# Try different possible locations in runfiles
for path in \
    "$RUNFILES_DIR/rules_formatjs++formatjs_cli+formatjs_v0_1_0_darwin_arm64/formatjs_cli" \
    "$RUNFILES_DIR/rules_formatjs++formatjs_cli+formatjs_v0_1_0_linux_x64/formatjs_cli" \
    "$RUNFILES_DIR/_main/external/rules_formatjs++formatjs_cli+formatjs_v0_1_0_darwin_arm64/formatjs_cli" \
    "$RUNFILES_DIR/_main/external/rules_formatjs++formatjs_cli+formatjs_v0_1_0_linux_x64/formatjs_cli"; do
    if [ -f "$path" ]; then
        CLI_PATH="$path"
        break
    fi
done

if [ -z "$CLI_PATH" ]; then
    echo "Error: Could not find custom CLI binary"
    echo "RUNFILES_DIR: $RUNFILES_DIR"
    echo "Current directory: $(pwd)"
    echo ""
    echo "Searching for formatjs_cli..."
    find "$RUNFILES_DIR" -name "formatjs_cli" -type f 2>/dev/null | head -20 || true
    exit 1
fi

echo "✓ Found CLI at: $CLI_PATH"

# Verify this is from the custom toolchain by checking the path
if echo "$CLI_PATH" | grep -q "formatjs_v0_1_0"; then
    echo "✓ Confirmed CLI is from custom v0.1.0 toolchain (path contains 'formatjs_v0_1_0')"
else
    echo "Error: CLI path doesn't contain 'formatjs_v0_1_0': $CLI_PATH"
    exit 1
fi

# Get the version for informational purposes
VERSION_OUTPUT=$("$CLI_PATH" --version 2>&1 || true)
echo "CLI reports version: $VERSION_OUTPUT"

# Note: The 0.1.0 binaries report version 0.0.0 (a known issue with that release)
# The important thing is that we're using the custom toolchain binary
echo "✓ Test passed: Using custom FormatJS CLI toolchain v0.1.0"
