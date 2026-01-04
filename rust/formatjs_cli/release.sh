#!/bin/bash
# Build release binaries for FormatJS Rust CLI
# Supports: macOS (darwin) and Linux cross-compilation
set -e

VERSION=$(grep '^version' Cargo.toml | head -1 | cut -d'"' -f2)
DIST_DIR="dist/v${VERSION}"

echo "🚀 Building FormatJS Rust CLI v${VERSION}"
echo "=========================================="
echo ""

# Create dist directory
mkdir -p "$DIST_DIR"

# Detect host OS
if [[ "$OSTYPE" == "darwin"* ]]; then
  HOST_OS="darwin"
  HOST_TARGET="aarch64-apple-darwin"
  if [[ $(uname -m) == "x86_64" ]]; then
    HOST_TARGET="x86_64-apple-darwin"
  fi
else
  HOST_OS="linux"
  HOST_TARGET="x86_64-unknown-linux-gnu"
fi

echo "📋 Build Configuration:"
echo "  Version: ${VERSION}"
echo "  Host OS: ${HOST_OS}"
echo "  Host Target: ${HOST_TARGET}"
echo ""

# Build for macOS (darwin)
if [[ "$HOST_OS" == "darwin" ]]; then
  echo "🍎 Building for macOS (darwin)..."

  # Build for Apple Silicon (aarch64)
  echo "  - Building for aarch64-apple-darwin (Apple Silicon)..."
  rustup target add aarch64-apple-darwin
  cargo build --release --target aarch64-apple-darwin
  cp target/aarch64-apple-darwin/release/formatjs_cli "$DIST_DIR/formatjs_cli-darwin-arm64"

  # Build for Intel (x86_64)
  echo "  - Building for x86_64-apple-darwin (Intel)..."
  rustup target add x86_64-apple-darwin
  cargo build --release --target x86_64-apple-darwin
  cp target/x86_64-apple-darwin/release/formatjs_cli "$DIST_DIR/formatjs_cli-darwin-x64"

  echo "  ✓ macOS builds complete"
  echo ""
fi

# Build for Linux (cross-compile from macOS or native on Linux)
echo "🐧 Building for Linux..."

# Check if cross-compilation tools are available
if [[ "$HOST_OS" == "darwin" ]]; then
  echo "  ℹ️  Cross-compiling from macOS to Linux"
  echo ""
  echo "  📦 Checking cross-compilation prerequisites..."

  # Check if Linux target is installed
  if ! rustup target list --installed | grep -q "x86_64-unknown-linux-gnu"; then
    echo "  - Adding x86_64-unknown-linux-gnu target..."
    rustup target add x86_64-unknown-linux-gnu
  fi

  # Check if musl target is installed (for static binaries)
  if ! rustup target list --installed | grep -q "x86_64-unknown-linux-musl"; then
    echo "  - Adding x86_64-unknown-linux-musl target..."
    rustup target add x86_64-unknown-linux-musl
  fi

  # Check for cross-compilation linker
  if command -v x86_64-unknown-linux-gnu-gcc &> /dev/null; then
    echo "  ✓ Found x86_64-unknown-linux-gnu-gcc"
    LINUX_TARGET="x86_64-unknown-linux-gnu"
  elif command -v zig &> /dev/null; then
    echo "  ✓ Found zig (will use as linker)"
    export CC_x86_64_unknown_linux_gnu="zig cc -target x86_64-linux-gnu"
    export CXX_x86_64_unknown_linux_gnu="zig c++ -target x86_64-linux-gnu"
    export AR_x86_64_unknown_linux_gnu="zig ar"
    LINUX_TARGET="x86_64-unknown-linux-gnu"
  else
    echo "  ⚠️  No Linux cross-compiler found, trying musl (static binary)..."
    echo ""
    echo "  💡 To improve cross-compilation, install one of:"
    echo "     - zig: brew install zig"
    echo "     - cross: cargo install cross"
    LINUX_TARGET="x86_64-unknown-linux-musl"
  fi

  echo ""
  echo "  - Building for ${LINUX_TARGET}..."

  # Try building with cargo
  if cargo build --release --target "$LINUX_TARGET" 2>&1; then
    cp "target/${LINUX_TARGET}/release/formatjs_cli" "$DIST_DIR/formatjs_cli-linux-x64"
    echo "  ✓ Linux build complete"
  else
    echo "  ❌ Linux cross-compilation failed"
    echo ""
    echo "  💡 Alternatives:"
    echo "     1. Install zig: brew install zig"
    echo "     2. Install cross: cargo install cross && cross build --release --target x86_64-unknown-linux-gnu"
    echo "     3. Build on a Linux machine"
    echo ""
    echo "  Skipping Linux build..."
  fi
else
  # Native Linux build
  echo "  - Building for x86_64-unknown-linux-gnu..."
  cargo build --release --target x86_64-unknown-linux-gnu
  cp target/x86_64-unknown-linux-gnu/release/formatjs_cli "$DIST_DIR/formatjs_cli-linux-x64"
  echo "  ✓ Linux build complete"
fi

echo ""
echo "=========================================="
echo "✅ Release build complete!"
echo ""
echo "📦 Artifacts in ${DIST_DIR}:"
ls -lh "$DIST_DIR"
echo ""

# Calculate checksums
echo "🔐 Generating checksums..."
cd "$DIST_DIR"
shasum -a 256 formatjs_cli-* > checksums.txt
cat checksums.txt
cd - > /dev/null
echo ""

# Test binaries
echo "🧪 Testing binaries..."
for binary in "$DIST_DIR"/formatjs_cli-*; do
  if [[ -f "$binary" ]] && [[ -x "$binary" ]]; then
    echo "  - Testing $(basename $binary)..."
    if $binary --version &> /dev/null; then
      echo "    ✓ $(basename $binary): $($binary --version)"
    else
      echo "    ⚠️  $(basename $binary): Not executable on this platform"
    fi
  fi
done

echo ""
echo "🎉 Done! Release artifacts are ready in ${DIST_DIR}/"
