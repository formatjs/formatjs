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

**Triggered by**: the `formatjs_cli_v*` tag created when a Release Please PR is
merged (for example, `formatjs_cli_v0.1.0`). Normal releases should come from
Release Please rather than manual tags so npm package versions, changelogs,
GitHub releases, and the npm publish handoff stay in one flow.

**What it does**:

1. Build macOS ARM64, Linux x86_64, Linux ARM64, and Windows x64 binaries in one Linux BuildBuddy RBE Bazel job
2. Verify artifacts on the corresponding macOS, Linux, and Windows runners
3. Combine artifacts and generate checksums
4. Create a GitHub Release with all binaries

**Release artifacts**:

- `formatjs_cli-darwin-arm64` (macOS Apple Silicon)
- `formatjs_cli-linux-arm64` (Linux ARM64)
- `formatjs_cli-linux-x64` (Linux x86_64)
- `formatjs_cli-win32-x64.exe` (Windows x64)
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

The normal repository workflow handles this ordering automatically:

1. Release Please opens and maintains release PRs for the Rust crates.
2. Merging the release PR creates GitHub releases with generated changelog
   notes that include PR titles, PR links, and contributors.
3. The `crates-release.yml` workflow publishes matching crate releases to
   crates.io with trusted publishing and waits for workspace dependencies before
   publishing dependents.

The package name is `formatjs_cli`, but the installed command is `formatjs` because `Cargo.toml` defines:

```toml
[[bin]]
name = "formatjs"
path = "src/main.rs"
```

## Platform Support

| Platform | Architecture  | Target Triple              | Status               |
| -------- | ------------- | -------------------------- | -------------------- |
| macOS    | Apple Silicon | aarch64-apple-darwin       | ✅ LLVM cross target |
| Linux    | ARM64         | aarch64-unknown-linux-musl | ✅ LLVM cross target |
| Linux    | x86_64        | x86_64-unknown-linux-musl  | ✅ LLVM cross target |
| Windows  | x86_64        | x86_64-pc-windows-gnullvm  | ✅ LLVM cross target |

**Note**: The GitHub Actions workflow builds release artifacts through Bazel targets on Linux BuildBuddy RBE when credentials are available. Linux release binaries use musl targets for static artifacts; the standalone Windows CLI uses the LLVM gnullvm target and is smoke-tested on a Windows runner.

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

# Windows x64 release artifact:
bazel build --compilation_mode=opt //crates/formatjs_cli:release_binary_windows_x64_gnullvm
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
├── formatjs_cli-win32-x64.exe     # Windows x64
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

The GitHub Actions workflows automate the GitHub release, crate publish, and
binary artifact process:

1. **Merge the Release Please PR**:

   Release Please updates `Cargo.toml`, `Cargo.lock`, package manifests, and
   changelogs. When the release PR is merged, it creates the
   `formatjs_cli_v<version>` GitHub release with generated changelog notes.

2. **npm package publish runs automatically**:

   The `release-please.yml` workflow calls `release.yml` with the npm package
   paths released by Release Please. `release.yml` builds the Bazel `:dist`
   output and publishes those packages through npm Trusted Publishing.

3. **Crates.io publish runs automatically**:

   The `crates-release.yml` workflow publishes `formatjs_cli` through crates.io
   trusted publishing after the parser crate dependencies are available.

4. **Rust CLI Release runs automatically**:
   - Builds macOS, Linux, and Windows binaries through Bazel on Linux BuildBuddy RBE
   - Runs smoke tests on macOS, Linux, and Windows runners
   - Uploads binaries and checksums to the existing GitHub release
   - Appends binary installation notes without replacing the changelog

5. **Manual verification** (optional):
   - Check GitHub Actions run completed successfully
   - Download and test binaries from the release
   - Verify checksums

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
build: # Build release binaries on Linux BuildBuddy RBE
verify-macos: # Smoke-test macOS binary
verify-linux: # Smoke-test and inspect Linux binaries
verify-windows: # Smoke-test Windows binary
release: # Combine, checksum, and create release
```

**Features**:

1. **Multi-platform builds**: Bazel cross-compiles all release artifacts in one Linux BuildBuddy RBE job
2. **Smoke tests**: Platform runners test downloaded artifacts with `--version` and `--help`
3. **Artifact management**: 7-day retention during workflow, permanent in releases
4. **Checksum generation**: Automatic SHA-256 checksums
5. **GitHub Release**: Automatic creation with formatted release notes
6. **BuildBuddy integration**: Remote execution and caching for release builds when credentials are available

## License

Same as the main FormatJS project (MIT).
