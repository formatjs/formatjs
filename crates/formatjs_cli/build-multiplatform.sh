#!/bin/bash
# Build formatjs CLI for Darwin ARM64, Linux x64, and Linux ARM64
# Usage: ./build-multiplatform.sh
# Default: builds for darwin_arm64, linux_x86_64, and linux_aarch64

set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-$REPO_ROOT/dist/formatjs_cli}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building formatjs CLI for Darwin ARM64, Linux x64, and Linux ARM64${NC}"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

build_platform() {
    local label="$1"
    local platform="$2"
    local output_name="$3"
    local log_name="$4"
    local note="${5:-}"

    echo -e "${BLUE}Building for ${label}...${NC}"
    if [ -n "$note" ]; then
        echo -e "${YELLOW}${note}${NC}"
    fi

    if bazel build --platforms="$platform" //crates/formatjs_cli:formatjs_cli 2>&1 | tee "/tmp/$log_name"; then
        BINARY_PATH=$(bazel cquery --output=files --platforms="$platform" //crates/formatjs_cli:formatjs_cli 2>/dev/null)
        if [ -f "$BINARY_PATH" ]; then
            cp "$BINARY_PATH" "$OUTPUT_DIR/$output_name"
            chmod +x "$OUTPUT_DIR/$output_name"
            echo -e "${GREEN}✓ Built ${output_name}${NC}"
            ls -lh "$OUTPUT_DIR/$output_name"
            file "$OUTPUT_DIR/$output_name" 2>/dev/null || true
        else
            echo -e "${RED}✗ Binary not found${NC}"
        fi
    else
        echo -e "${RED}✗ Failed to build for ${label}${NC}"
        echo -e "${YELLOW}Build logs saved to /tmp/${log_name}${NC}"
    fi
    echo ""
}

build_platform \
    "Darwin ARM64" \
    "//crates/formatjs_cli/platforms:darwin_arm64" \
    "formatjs-darwin-arm64" \
    "build_darwin_arm64.log"

build_platform \
    "Linux x64" \
    "//crates/formatjs_cli/platforms:linux_x86_64" \
    "formatjs-linux-x86_64" \
    "build_linux_x64.log" \
    "Note: Cross-compilation to Linux may require additional toolchain setup"

build_platform \
    "Linux ARM64" \
    "//crates/formatjs_cli/platforms:linux_aarch64" \
    "formatjs-linux-arm64" \
    "build_linux_arm64.log" \
    "Note: Cross-compilation to Linux ARM64 may require additional toolchain setup"

echo -e "${GREEN}Build complete!${NC}"
echo "Binaries are in: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR" 2>/dev/null || true
