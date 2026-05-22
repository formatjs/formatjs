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

Before creating the tag, run the **Prerelease** GitHub Actions workflow and wait
for its version commit to land on `main`. The Rust CLI release tag must point at
that post-prerelease commit. If the `formatjs_cli_v*` tag is created first,
lerna-lite can treat it as the latest release point and fail to derive package
changelogs correctly.

```bash
# After Prerelease has landed on main, create and push the release tag
git tag formatjs_cli_v0.1.0
git push origin formatjs_cli_v0.1.0
```

**What it does**:

1. Build macOS ARM64, Linux x86_64, and Linux ARM64 binaries in one Bazel build job
2. Verify artifacts on the corresponding macOS and Linux runners
3. Combine artifacts and generate checksums
4. Create a GitHub Release with all binaries

**Release artifacts**:

- `formatjs_cli-darwin-arm64` (macOS Apple Silicon)
- `formatjs_cli-linux-arm64` (Linux ARM64)
- `formatjs_cli-linux-x64` (Linux x86_64)
- `checksums.txt` (SHA-256 checksums)

### Option 2: Publishing to crates.io

Cargo distribution is source-based: users install the package and build the `formatjs` executable locally.

```bash
cargo install formatjs_cli
formatjs --help
```

Before publishing `formatjs_cli`, ensure any workspace dependencies are already published with compatible versions. This crate depends on the FormatJS Rust parser crates, so publish or update those crates first:

1. `formatjs_icu_skeleton_parser`
2. `formatjs_icu_messageformat_parser`
3. `formatjs_cli`

The package name is `formatjs_cli`, but the installed command is `formatjs` because `Cargo.toml` defines:

```toml
[[bin]]
name = "formatjs"
path = "src/main.rs"
```

## Platform Support

| Platform | Architecture  | Target Triple             | Status                                |
| -------- | ------------- | ------------------------- | ------------------------------------- |
| macOS    | Apple Silicon | aarch64-apple-darwin      | ✅ Native (Bazel on GHA macOS runner) |
| Linux    | ARM64         | aarch64-unknown-linux-gnu | ✅ Bazel release target               |
| Linux    | x86_64        | x86_64-unknown-linux-gnu  | ✅ Bazel release target               |

**Note**: The GitHub Actions workflow builds release artifacts through Bazel targets. Linux release binaries use musl targets for static artifacts.

## Cross-Compilation Setup

### For Linux builds from macOS

You have several options:

#### Option A: Using Zig (Easiest)

```bash
# Install zig (provides a cross-platform linker)
brew install zig

# Add Linux targets
rustup target add x86_64-unknown-linux-gnu
rustup target add aarch64-unknown-linux-gnu

# Zig will be automatically detected and used as the linker
```

#### Option B: Using musl (Static binaries)

```bash
# Add musl targets (produces static binaries)
rustup target add x86_64-unknown-linux-musl
rustup target add aarch64-unknown-linux-musl

# Build
cargo build --release --target x86_64-unknown-linux-musl
cargo build --release --target aarch64-unknown-linux-musl
```

#### Option C: Using cross

```bash
# Install cross (Docker-based cross-compilation)
cargo install cross

# Build
cross build --release --target x86_64-unknown-linux-gnu
cross build --release --target aarch64-unknown-linux-gnu
```

## Manual Building

### Build with Bazel

```bash
# Build for current platform
bazel build --compilation_mode=opt //crates/formatjs_cli:release_binary

# Build for specific platform (requires being on that platform)
# macOS ARM64:
bazel build --compilation_mode=opt --platforms=//crates/formatjs_cli/platforms:darwin_arm64 //crates/formatjs_cli:release_binary

# Linux x86_64 static release artifact:
bazel build --compilation_mode=opt //crates/formatjs_cli:release_binary_linux_x64

# Linux ARM64 static release artifact:
bazel build --compilation_mode=opt //crates/formatjs_cli:release_binary_linux_arm64
```

Use `bazel cquery --output=files <target>` to locate platform-specific release target outputs.

**Note**: Prefer the platform-specific Bazel release targets in CI for reproducible release artifacts.

### Build for specific platform with Cargo

```bash
# macOS Apple Silicon
cargo build --release --target aarch64-apple-darwin

# macOS Intel
cargo build --release --target x86_64-apple-darwin

# Linux x86_64 (requires cross-compilation setup)
cargo build --release --target x86_64-unknown-linux-gnu

# Linux ARM64 (requires cross-compilation setup)
cargo build --release --target aarch64-unknown-linux-gnu
```

Binaries will be in `target/<triple>/release/formatjs`.

## Release Artifacts

After running the GitHub Actions workflow, artifacts will be available:

1. **During the workflow run**: As job artifacts (7 day retention)
2. **After tag push**: As GitHub Release assets

```
Release assets:
├── formatjs_cli-darwin-arm64      # macOS Apple Silicon
├── formatjs_cli-linux-arm64       # Linux ARM64
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

The GitHub Actions workflow automates the GitHub binary release process:

1. **Run Prerelease first**:

   Trigger the **Prerelease** GitHub Actions workflow and wait for the resulting
   version commit to land on `main`. This must happen before any
   `formatjs_cli_v*` tag is created so lerna-lite can derive package changelogs
   from the correct release history.

2. **Tag the release**:

   ```bash
   # Update version in crates/formatjs_cli/Cargo.toml, Cargo.lock,
   # and FORMATJS_CLI_VERSION in crates/formatjs_cli/BUILD.bazel if needed
   git tag formatjs_cli_v0.1.0
   git push origin formatjs_cli_v0.1.0
   ```

3. **Workflow runs automatically**:
   - Builds both macOS and Linux binaries
   - Runs smoke tests
   - Creates GitHub Release with all artifacts

4. **Manual verification** (optional):
   - Check GitHub Actions run completed successfully
   - Download and test binaries from the release
   - Verify checksums

5. **Publish to npm** (if applicable):

   ```bash
   # Update package.json with release URLs
   # Point to GitHub release assets
   npm publish
   ```

5. **Publish to crates.io** (if applicable):

   ```bash
   # From the repository root, after publishing dependent parser crates
   cargo publish -p formatjs_cli
   ```

   Users can then install and run:

   ```bash
   cargo install formatjs_cli
   formatjs --version
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

**Solution**: Ensure `rules_rs` is properly configured in `MODULE.bazel`.

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
build: # Build release binaries
verify-macos: # Smoke-test macOS binary
verify-linux: # Smoke-test and inspect Linux binaries
release: # Combine, checksum, and create release
```

**Features**:

1. **Multi-platform builds**: Bazel builds all release artifacts in one job
2. **Smoke tests**: Platform runners test downloaded artifacts with `--version` and `--help`
3. **Artifact management**: 7-day retention during workflow, permanent in releases
4. **Checksum generation**: Automatic SHA-256 checksums
5. **GitHub Release**: Automatic creation with formatted release notes
6. **BuildBuddy integration**: Optional remote caching

## License

Same as the main FormatJS project (MIT).
