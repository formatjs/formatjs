# FormatJS Rust CLI - Release Guide

This document explains how to build release binaries for the FormatJS Rust CLI for multiple platforms.

## Quick Start

### Option 1: Using GitHub Actions (Recommended for Releases)

The repository includes two GitHub Actions workflows:

#### 1. Build & Test Workflow (`.github/workflows/rust-cli-test.yml`)

**Runs automatically on**:

- Pull requests that modify Rust code
- Pushes to `main` branch
- Can be triggered manually

**What it does**:

- Builds Rust CLI on both macOS and Linux
- Runs unit tests
- Runs integration tests
- Performs smoke tests

#### 2. Release Workflow (`.github/workflows/rust-cli-release.yml`)

**Triggered by**: Push a tag starting with `formatjs_cli_v` (e.g., `formatjs_cli_v0.1.0`)

```bash
# Create and push a release tag
git tag formatjs_cli_v0.1.0
git push origin formatjs_cli_v0.1.0
```

**What it does**:

1. Build macOS ARM64 binary natively on macOS runner
2. Build Linux x86_64 binary natively on Linux runner
3. Run smoke tests on both binaries
4. Combine artifacts and generate checksums
5. Create a GitHub Release with all binaries

**Release artifacts**:

- `formatjs_cli-darwin-arm64` (macOS Apple Silicon)
- `formatjs_cli-linux-x64` (Linux x86_64)
- `checksums.txt` (SHA-256 checksums)

### Option 2: Using Cargo

```bash
cd rust/formatjs_cli
./release.sh
```

This uses native Cargo cross-compilation. Requires additional setup for cross-compilation (see below).

## Platform Support

| Platform | Architecture  | Target Triple            | Status                                |
| -------- | ------------- | ------------------------ | ------------------------------------- |
| macOS    | Apple Silicon | aarch64-apple-darwin     | ✅ Native (Bazel on GHA macOS runner) |
| Linux    | x86_64        | x86_64-unknown-linux-gnu | ✅ Native (Bazel on GHA Linux runner) |

**Note**: The GitHub Actions workflow builds each platform natively on its respective runner, avoiding complex cross-compilation setup.

## Cross-Compilation Setup

### For Linux builds from macOS

You have several options:

#### Option A: Using Zig (Easiest)

```bash
# Install zig (provides a cross-platform linker)
brew install zig

# Add Linux target
rustup target add x86_64-unknown-linux-gnu

# Zig will be automatically detected and used as the linker
```

#### Option B: Using musl (Static binaries)

```bash
# Add musl target (produces static binaries)
rustup target add x86_64-unknown-linux-musl

# Build
cargo build --release --target x86_64-unknown-linux-musl
```

#### Option C: Using cross

```bash
# Install cross (Docker-based cross-compilation)
cargo install cross

# Build
cross build --release --target x86_64-unknown-linux-gnu
```

## Manual Building

### Build with Bazel

```bash
# Build for current platform
bazel build --compilation_mode=opt //rust/formatjs_cli:release_binary

# Build for specific platform (requires being on that platform)
# macOS ARM64:
bazel build --compilation_mode=opt --platforms=//rust/formatjs_cli/platforms:darwin_arm64 //rust/formatjs_cli:release_binary

# Linux x86_64:
bazel build --compilation_mode=opt --platforms=//rust/formatjs_cli/platforms:linux_x86_64 //rust/formatjs_cli:release_binary
```

Binary will be in `bazel-bin/rust/formatjs_cli/formatjs_cli_release`.

**Note**: Bazel builds each platform natively (no cross-compilation). Use GitHub Actions to build both platforms.

### Build for specific platform with Cargo

```bash
# macOS Apple Silicon
cargo build --release --target aarch64-apple-darwin

# macOS Intel
cargo build --release --target x86_64-apple-darwin

# Linux x86_64 (requires cross-compilation setup)
cargo build --release --target x86_64-unknown-linux-gnu
```

Binaries will be in `target/<triple>/release/formatjs_cli`.

## Release Artifacts

After running the GitHub Actions workflow, artifacts will be available:

1. **During the workflow run**: As job artifacts (7 day retention)
2. **After tag push**: As GitHub Release assets

```
Release assets:
├── formatjs_cli-darwin-arm64      # macOS Apple Silicon
├── formatjs_cli-linux-x64         # Linux x86_64
└── checksums.txt                  # SHA-256 checksums
```

### Verify checksums

```bash
# Download from release
curl -LO https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.0/checksums.txt
curl -LO https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.0/formatjs_cli-darwin-arm64

shasum -a 256 -c checksums.txt
```

## Testing Binaries

The GitHub Actions workflow includes smoke tests that run automatically:

```bash
./formatjs_cli-{platform} --version
./formatjs_cli-{platform} --help
```

To test manually after downloading:

```bash
# macOS Apple Silicon
chmod +x formatjs_cli-darwin-arm64
./formatjs_cli-darwin-arm64 --version

# Linux
chmod +x formatjs_cli-linux-x64
./formatjs_cli-linux-x64 --version
```

## Publishing

The GitHub Actions workflow automates the entire release process:

1. **Tag the release**:

   ```bash
   # Update version in Cargo.toml if needed
   git tag formatjs_cli_v0.1.0
   git push origin formatjs_cli_v0.1.0
   ```

2. **Workflow runs automatically**:
   - Builds both macOS and Linux binaries
   - Runs smoke tests
   - Creates GitHub Release with all artifacts

3. **Manual verification** (optional):
   - Check GitHub Actions run completed successfully
   - Download and test binaries from the release
   - Verify checksums

4. **Publish to npm** (if applicable):
   ```bash
   # Update package.json with release URLs
   # Point to GitHub release assets
   npm publish
   ```

## Troubleshooting

### Linux cross-compilation fails

**Problem**: `cargo build --target x86_64-unknown-linux-gnu` fails with linker errors.

**Solutions**:

1. Install zig: `brew install zig` (easiest)
2. Use musl target: `cargo build --target x86_64-unknown-linux-musl`
3. Use cross: `cargo install cross && cross build --target x86_64-unknown-linux-gnu`
4. Build on an actual Linux machine

### Binary doesn't run on target platform

**Problem**: Binary fails to execute with "exec format error" or "cannot execute binary file".

**Cause**: Binary was built for wrong architecture.

**Solution**: Verify the target triple matches your platform:

```bash
file dist/v<version>/formatjs_cli-*
```

### "Unknown platform" error with Bazel

**Problem**: Bazel can't find the platform definition.

**Solution**: Ensure `rules_rust` is properly configured in `MODULE.bazel` or `WORKSPACE`.

## CI/CD Integration

The repository includes two production-ready GitHub Actions workflows:

### 1. Build & Test Workflow (`.github/workflows/rust-cli-test.yml`)

**Purpose**: Continuous integration for all changes

**Triggers**:

- Pull requests modifying Rust code
- Pushes to `main` branch
- Manual dispatch

**Jobs**:

```yaml
build-and-test-macos: # Build and test on macOS runner
build-and-test-linux: # Build and test on Linux runner
```

**Features**:

- Concurrent testing on both platforms
- Unit tests and integration tests
- Smoke tests for binaries
- BuildBuddy integration (optional, via API key)

### 2. Release Workflow (`.github/workflows/rust-cli-release.yml`)

**Purpose**: Create official releases with binaries

**Triggers**:

- Push a tag starting with `formatjs_cli_v`

**Jobs**:

```yaml
build-macos: # Build macOS binary
build-linux: # Build Linux binary
combine-and-release: # Combine, checksum, and create release
```

**Features**:

1. **Multi-platform builds**: macOS and Linux built natively
2. **Smoke tests**: Automatic testing with `--version` and `--help`
3. **Artifact management**: 7-day retention during workflow, permanent in releases
4. **Checksum generation**: Automatic SHA-256 checksums
5. **GitHub Release**: Automatic creation with formatted release notes
6. **BuildBuddy integration**: Optional remote caching

## License

Same as the main FormatJS project (MIT).
