# formatjs_cli

A high-performance Rust-based command-line interface for FormatJS internationalization tools.

## Overview

`formatjs_cli` is a Rust implementation of the FormatJS CLI, providing fast and efficient tools for working with ICU MessageFormat messages in your internationalization workflow.

## Features

- **Parse**: Parse and validate ICU MessageFormat messages
- **Compile**: Compile messages for production use with optional minification
- **Extract**: Extract messages from source files
- **Validate**: Validate message files and check for unused messages

## Installation

### Using Bazel

Build the CLI using Bazel for host platform:

```bash
bazel build //rust/formatjs_cli:formatjs
```

Run directly with Bazel:

```bash
bazel run //rust/formatjs_cli:formatjs -- --help
```

### Multi-Platform Build (Darwin ARM64 + Linux x64)

Build for both Darwin ARM64 and Linux x64:

```bash
cd rust/formatjs_cli
./build-multiplatform.sh
```

This will create binaries in `dist/formatjs_cli/`:

- `formatjs-darwin-arm64` - macOS Apple Silicon binary
- `formatjs-linux-x86_64` - Linux x86_64 binary

You can also build for specific platforms using Bazel directly:

```bash
# Build for Darwin ARM64 (macOS Apple Silicon)
bazel build --platforms=//rust/formatjs_cli/platforms:darwin_arm64 //rust/formatjs_cli:formatjs_cli

# Build for Linux x64
bazel build --platforms=//rust/formatjs_cli/platforms:linux_x86_64 //rust/formatjs_cli:formatjs_cli
```

### Using Cargo

Build and install using Cargo (host platform only):

```bash
cd rust/formatjs_cli
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
bazel test //rust/formatjs_cli:formatjs_cli_test
```

Using Cargo:

```bash
cargo test
```

### Project Structure

```
rust/formatjs_cli/
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

- Large message files
- Batch processing
- CI/CD pipelines

## Contributing

Contributions are welcome! Please see the main [FormatJS repository](https://github.com/formatjs/formatjs) for contribution guidelines.

## License

MIT

## Related Packages

- [@formatjs/cli](../../packages/cli) - Node.js-based CLI
- [formatjs_icu_messageformat_parser](../icu_messageformat_parser) - ICU MessageFormat parser
- [formatjs_icu_skeleton_parser](../icu_skeleton_parser) - ICU skeleton parser
