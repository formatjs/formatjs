# formatjs_cli

A high-performance Rust-based command-line interface for FormatJS internationalization tools.

## Overview

`formatjs_cli` is a high-performance Rust implementation of the FormatJS CLI, providing fast and efficient tools for working with ICU MessageFormat messages in your internationalization workflow.

### Why Use the Native CLI?

The native Rust CLI offers significant advantages over the Node.js-based `@formatjs/cli`:

- **🚀 Faster Performance**: Up to 10-100x faster for large codebases
- **📦 Zero Dependencies**: Single binary with no Node.js or npm packages required
- **💾 Lower Memory Usage**: Minimal memory footprint compared to Node.js
- **⚡ Instant Startup**: No Node.js initialization overhead
- **🔧 Easy Distribution**: Standalone binaries for CI/CD pipelines
- **🎯 Perfect for CI/CD**: Fast, reliable, and cache-friendly

**Benchmark results** (processing ~1000 message files):

- Node.js CLI: ~8.5 seconds
- Rust CLI: ~0.5 seconds (17x faster)

The native CLI is a drop-in replacement for `@formatjs/cli` with identical command-line interface and output format.

## Features

- **Extract**: Extract messages from source files (React, Vue, etc.)
- **Compile**: Compile messages for production use with optional minification
- **Verify**: Validate message files and check for missing/extra keys
- **Compile-Folder**: Batch compile all translation files in a folder

## Quick Start

```bash
# Download the binary (macOS Apple Silicon example)
curl -L https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.6/formatjs-darwin-arm64 -o formatjs
chmod +x formatjs

# Extract messages from your source code
./formatjs extract "src/**/*.tsx" --out-file messages.json

# Compile translations for production
./formatjs compile "translations/*.json" --out-file compiled.json --ast

# Verify translations are complete
./formatjs verify "translations/*.json" --source-locale en --missing-keys
```

## Installation

### Pre-built Binaries (Recommended)

Download pre-built native binaries from the [GitHub Releases](https://github.com/formatjs/formatjs/releases) page:

**Latest Release:** [formatjs_cli_v0.1.6](https://github.com/formatjs/formatjs/releases/tag/formatjs_cli_v0.1.6)

**Available binaries:**

- `formatjs-darwin-arm64` - macOS Apple Silicon (M1/M2/M3)
- `formatjs-linux-x86_64` - Linux x86_64

**Installation steps:**

1. Download the appropriate binary for your platform:

   ```bash
   # macOS Apple Silicon
   curl -L https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.6/formatjs-darwin-arm64 -o formatjs

   # Linux x86_64
   curl -L https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.6/formatjs-linux-x86_64 -o formatjs
   ```

2. Make it executable:

   ```bash
   chmod +x formatjs
   ```

3. Optionally, move it to your PATH:

   ```bash
   sudo mv formatjs /usr/local/bin/
   ```

4. Verify installation:
   ```bash
   formatjs --version
   ```

### Using Bazel

Build the CLI using Bazel for host platform:

```bash
bazel build //crates/formatjs_cli:formatjs
```

Run directly with Bazel:

```bash
bazel run //crates/formatjs_cli:formatjs -- --help
```

### Multi-Platform Build (Darwin ARM64 + Linux x64)

Build for both Darwin ARM64 and Linux x64:

```bash
cd crates/formatjs_cli
./build-multiplatform.sh
```

This will create binaries in `dist/formatjs_cli/`:

- `formatjs-darwin-arm64` - macOS Apple Silicon binary
- `formatjs-linux-x86_64` - Linux x86_64 binary

You can also build for specific platforms using Bazel directly:

```bash
# Build for Darwin ARM64 (macOS Apple Silicon)
bazel build --platforms=//crates/formatjs_cli/platforms:darwin_arm64 //crates/formatjs_cli:formatjs_cli

# Build for Linux x64
bazel build --platforms=//crates/formatjs_cli/platforms:linux_x86_64 //crates/formatjs_cli:formatjs_cli
```

### Using Cargo

Build and install using Cargo (host platform only):

```bash
cd crates/formatjs_cli
cargo build --release
cargo install --path .
```

## Usage

### Extract Command

Extract string messages from React components that use react-intl:

```bash
formatjs extract "src/**/*.tsx" --out-file messages.json
```

**Full example with options:**

```bash
formatjs extract "src/**/*.{js,ts,tsx}" \
  --out-file extracted.json \
  --id-interpolation-pattern '[sha512:contenthash:base64:6]' \
  --additional-function-names t,__ \
  --flatten \
  --extract-source-location
```

**Options:**

- `[FILES]...` - File glob patterns to extract from (e.g., `src/**/*.tsx`)
- `--format <PATH>` - Path to formatter file controlling JSON output shape
- `--in-file <PATH>` - File containing list of files to extract (one per line)
- `--out-file <PATH>` - Target file for aggregated .json output
- `--id-interpolation-pattern <PATTERN>` - Pattern to auto-generate message IDs (default: `[sha512:contenthash:base64:6]`)
- `--extract-source-location` - Extract metadata about message location in source
- `--additional-component-names <NAMES>` - Additional component names to extract from (comma-separated)
- `--additional-function-names <NAMES>` - Additional function names to extract from (comma-separated)
- `--ignore <PATTERNS>` - Glob patterns to exclude
- `--throws` - Throw exception when failing to process any file
- `--pragma <PRAGMA>` - Parse custom pragma for file metadata (e.g., `@intl-meta`)
- `--preserve-whitespace` - Preserve whitespace and newlines
- `--flatten` - Hoist selectors and flatten sentences

### Compile Command

Compile extracted translation files into react-intl consumable JSON:

```bash
formatjs compile "lang/*.json" --out-file compiled.json
```

**Full example with options:**

```bash
formatjs compile "lang/*.json" \
  --out-file compiled.json \
  --ast \
  --pseudo-locale en-XA
```

**Options:**

- `[TRANSLATION_FILES]...` - Glob patterns for translation files (e.g., `foo/**/en.json`)
- `--format <PATH>` - Path to formatter file that converts input to `Record<string, string>`
- `--out-file <PATH>` - Output file path (prints to stdout if not provided)
- `--ast` - Compile to AST instead of strings
- `--skip-errors` - Continue compiling after errors (excludes keys with errors)
- `--pseudo-locale <LOCALE>` - Generate pseudo-locale files (requires `--ast`)
  - Values: `xx-LS`, `xx-AC`, `xx-HA`, `en-XA`, `en-XB`
- `--ignore-tag` - Treat HTML/XML tags as string literals

### Compile-Folder Command

Batch compile all translation JSON files in a folder:

```bash
formatjs compile-folder lang/ dist/lang/
```

**Full example with options:**

```bash
formatjs compile-folder lang/ dist/lang/ --ast
```

**Options:**

- `<FOLDER>` - Source directory containing translation JSON files
- `<OUT_FOLDER>` - Output directory for compiled files
- `--format <PATH>` - Path to formatter file
- `--ast` - Compile to AST

### Verify Command

Run checks on translation files to validate correctness:

```bash
formatjs verify "lang/*.json" --source-locale en --missing-keys
```

**Full example with all checks:**

```bash
formatjs verify "lang/*.json" \
  --source-locale en \
  --missing-keys \
  --extra-keys \
  --structural-equality
```

**Options:**

- `[TRANSLATION_FILES]...` - Glob patterns for translation files
- `--source-locale <LOCALE>` - **Required** for checks to work (e.g., `en`)
- `--ignore <PATTERNS>` - Glob patterns to ignore
- `--missing-keys` - Check for missing keys in target locales
- `--extra-keys` - Check for extra keys not in source locale
- `--structural-equality` - Check structural equality of messages

## Development

### Running Tests

Using Bazel:

```bash
bazel test //crates/formatjs_cli:formatjs_cli_test
```

Using Cargo:

```bash
cargo test
```

### Project Structure

```
crates/formatjs_cli/
├── Cargo.toml          # Cargo package manifest
├── BUILD.bazel         # Bazel build configuration
├── README.md           # This file
└── src/
    └── main.rs         # Main CLI implementation
```

## Dependencies

- `clap`: Command-line argument parsing
- `anyhow`: Error handling
- `serde` & `serde_json`: JSON serialization
- `formatjs_icu_messageformat_parser`: ICU MessageFormat parsing
- `formatjs_icu_skeleton_parser`: ICU skeleton parsing

## Performance

This Rust implementation provides significant performance improvements over the Node.js-based CLI, especially for:

- **Large codebases**: 10-100x faster extraction and compilation
- **Batch processing**: Minimal overhead when processing many files
- **CI/CD pipelines**: Faster builds and deployments
- **Memory efficiency**: Lower memory usage for large message catalogs

See the [benchmarks](../../benchmarks/cli-comparison) for detailed performance comparisons.

## Contributing

Contributions are welcome! Please see the main [FormatJS repository](https://github.com/formatjs/formatjs) for contribution guidelines.

## License

MIT

## Related Packages

- [@formatjs/cli](../../packages/cli) - Node.js-based CLI
- [formatjs_icu_messageformat_parser](../icu_messageformat_parser) - ICU MessageFormat parser
- [formatjs_icu_skeleton_parser](../icu_skeleton_parser) - ICU skeleton parser
