#!/bin/bash
# Build formatjs CLI for Darwin ARM64 and Linux x64
# Usage: ./build-multiplatform.sh
# Default: builds for both darwin_arm64 and linux_x86_64

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-$REPO_ROOT/dist/formatjs_cli}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building formatjs CLI for Darwin ARM64 and Linux x64${NC}"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Build for Darwin ARM64
echo -e "${BLUE}Building for Darwin ARM64...${NC}"
if bazel build --platforms=//rust/formatjs_cli/platforms:darwin_arm64 //rust/formatjs_cli:formatjs_cli 2>&1 | tee /tmp/build_darwin.log; then
    BINARY_PATH=$(bazel cquery --output=files --platforms=//rust/formatjs_cli/platforms:darwin_arm64 //rust/formatjs_cli:formatjs_cli 2>/dev/null)
    if [ -f "$BINARY_PATH" ]; then
        cp "$BINARY_PATH" "$OUTPUT_DIR/formatjs-darwin-arm64"
        chmod +x "$OUTPUT_DIR/formatjs-darwin-arm64"
        echo -e "${GREEN}✓ Built formatjs-darwin-arm64${NC}"
        ls -lh "$OUTPUT_DIR/formatjs-darwin-arm64"
        file "$OUTPUT_DIR/formatjs-darwin-arm64" 2>/dev/null || true
    else
        echo -e "${RED}✗ Binary not found${NC}"
    fi
else
    echo -e "${RED}✗ Failed to build for Darwin ARM64${NC}"
fi
echo ""

# Build for Linux x64
echo -e "${BLUE}Building for Linux x64...${NC}"
echo -e "${YELLOW}Note: Cross-compilation to Linux may require additional toolchain setup${NC}"
if bazel build --platforms=//rust/formatjs_cli/platforms:linux_x86_64 //rust/formatjs_cli:formatjs_cli 2>&1 | tee /tmp/build_linux.log; then
    BINARY_PATH=$(bazel cquery --output=files --platforms=//rust/formatjs_cli/platforms:linux_x86_64 //rust/formatjs_cli:formatjs_cli 2>/dev/null)
    if [ -f "$BINARY_PATH" ]; then
        cp "$BINARY_PATH" "$OUTPUT_DIR/formatjs-linux-x86_64"
        chmod +x "$OUTPUT_DIR/formatjs-linux-x86_64"
        echo -e "${GREEN}✓ Built formatjs-linux-x86_64${NC}"
        ls -lh "$OUTPUT_DIR/formatjs-linux-x86_64"
        file "$OUTPUT_DIR/formatjs-linux-x86_64" 2>/dev/null || true
    else
        echo -e "${RED}✗ Binary not found${NC}"
    fi
else
    echo -e "${RED}✗ Failed to build for Linux x64${NC}"
    echo -e "${YELLOW}Build logs saved to /tmp/build_linux.log${NC}"
fi
echo ""

echo -e "${GREEN}Build complete!${NC}"
echo "Binaries are in: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR" 2>/dev/null || true
