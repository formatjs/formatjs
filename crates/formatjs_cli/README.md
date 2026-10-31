# formatjs_cli

A high-performance Rust-based command-line interface for FormatJS internationalization tools.

## Overview

`formatjs_cli` is a high-performance Rust implementation of core FormatJS CLI workflows, providing fast tools for working with ICU MessageFormat messages in your internationalization workflow.

### Why Use the Native CLI?

The native Rust CLI offers significant advantages over the Node.js-based `@formatjs/cli`:

- **Faster Performance**: 20.90x faster in the checked-in extraction benchmark, with parallel parsing for large compile and verify workloads
- **Zero Node.js Runtime Dependency**: Single binary with no Node.js runtime required for supported features
- **Lower Memory Usage**: Minimal memory footprint compared to Node.js
- **Instant Startup**: No Node.js initialization overhead
- **Easy Distribution**: Standalone binaries for CI/CD pipelines
- **CI/CD Friendly**: Fast, reliable, and cache-friendly

**Benchmark results** (processing 1,000 generated files with 9,406 messages):

- Pure TypeScript Node.js CLI: ~8.5 seconds
- Hybrid Node.js/native CLI: 744.86 ms, 12,628 messages/second
- Rust CLI: 35.65 ms, 263,876 messages/second
- Speedup vs hybrid CLI: 20.90x

**Catalog benchmark results** (20,000 generated messages, Apple Silicon, 2026-05-25; includes process startup and JSON I/O):

| Workflow                       | Before   | After    | Improvement         |
| ------------------------------ | -------- | -------- | ------------------- |
| `compile --ast`                | 180.9 ms | 121.1 ms | 33.1% lower latency |
| `verify --structural-equality` | 373.3 ms | 228.8 ms | 38.7% lower latency |

The native CLI aims to match `@formatjs/cli` for supported workflows. Some Node-specific behavior is intentionally not available in the standalone Rust binary, including loading arbitrary JavaScript formatter files with `--format`.

## Threading

The native CLI parallelizes per-file and per-message work with Rayon. Extraction
uses per-file parallelism, while AST compilation and structural verification can
also parse individual messages in parallel. By default, Rayon uses the number of
available logical CPU cores. Set `RAYON_NUM_THREADS` to cap worker threads in
CPU-constrained environments:

```bash
RAYON_NUM_THREADS=4 formatjs extract "src/**/*.tsx" --out-file messages.json
```

## Features

- **Extract**: Extract messages from JavaScript and TypeScript source files
- **Compile**: Compile messages for production use with optional minification
- **Verify**: Validate message files and check for missing/extra keys
- **Compile-Folder**: Batch compile all translation files in a folder

## Quick Start

```bash
# Download a pre-built binary from the GitHub release
# https://github.com/formatjs/formatjs/releases

# Extract messages from your source code
formatjs extract "src/**/*.tsx" --out-file messages.json

# Compile translations for production
formatjs compile "translations/*.json" --out-file compiled.json --ast

# Verify translations are complete
formatjs verify "translations/*.json" --source-locale en --missing-keys
```

## Installation

### Local Cargo installation

`formatjs_cli` is distributed as pre-built GitHub release binaries, not through
crates.io. For local development from this repository:

```bash
cargo install --path crates/formatjs_cli
formatjs --help
```

You can also run without installing:

```bash
cargo run -p formatjs_cli -- --help
cargo run -p formatjs_cli -- extract "src/**/*.tsx"
```

### Pre-Built Binaries

Download pre-built native binaries from the [GitHub Releases](https://github.com/formatjs/formatjs/releases) page.

**Available binaries:**

- `formatjs_cli-darwin-arm64` - macOS Apple Silicon
- `formatjs_cli-linux-arm64` - Linux ARM64
- `formatjs_cli-linux-x64` - Linux x86_64
- `formatjs_cli-win32-x64.exe` - Windows x64

**Installation steps:**

1. Download the appropriate binary for your platform:

   ```bash
   # macOS Apple Silicon
   curl -L https://github.com/formatjs/formatjs/releases/download/<version>/formatjs_cli-darwin-arm64 -o formatjs

   # Linux x86_64
   curl -L https://github.com/formatjs/formatjs/releases/download/<version>/formatjs_cli-linux-x64 -o formatjs

   # Linux ARM64
   curl -L https://github.com/formatjs/formatjs/releases/download/<version>/formatjs_cli-linux-arm64 -o formatjs

   # Windows x64
   curl.exe -L https://github.com/formatjs/formatjs/releases/download/<version>/formatjs_cli-win32-x64.exe -o formatjs.exe
   ```

2. On macOS or Linux, make it executable:

   ```bash
   chmod +x formatjs
   ```

3. On macOS or Linux, optionally move it to your PATH:

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

### Cross-Platform Release Builds

Build the release binaries for Darwin ARM64, Linux x64, Linux ARM64, and Windows x64:

```bash
bazel build --compilation_mode=opt \
  //crates/formatjs_cli:release_binary_darwin_arm64 \
  //crates/formatjs_cli:release_binary_linux_x64 \
  //crates/formatjs_cli:release_binary_linux_arm64 \
  //crates/formatjs_cli:release_binary_windows_x64
```

Use `bazel cquery --output=files <target>` to locate each binary:

```bash
bazel cquery --output=files //crates/formatjs_cli:release_binary_darwin_arm64
bazel cquery --output=files //crates/formatjs_cli:release_binary_linux_x64
bazel cquery --output=files //crates/formatjs_cli:release_binary_linux_arm64
bazel cquery --output=files //crates/formatjs_cli:release_binary_windows_x64
```

### Local Cargo Build

Build and install from the local checkout using Cargo:

```bash
cd crates/formatjs_cli
cargo build --release
cargo install --path .
```

The built binary is `target/release/formatjs`.

## Usage

### Extract Command

Extract string messages from React components that use react-intl:

```bash
formatjs extract "src/**/*.tsx" --out-file messages.json
```

Rust extraction reads `formatjs_intl::message_descriptor!` descriptors and
inline `formatjs_intl::format_message!` or `formatjs_intl::formatted_message!` calls. Missing IDs use
`[sha512:contenthash:base64:10]`:

```rust
const GREETING: formatjs_intl::MessageDescriptor = formatjs_intl::message_descriptor!(
    default_message: "Hello, {name}!",
    description: "Greeting"
);

let greeting = formatjs_intl::format_message!(
    &intl,
    default_message: "Hello, {name}!",
    description: "Greeting",
    values: { name: user.name() },
);
```

Inline value names are checked against `default_message` at compile time.
Existing values maps remain supported for dynamic or reused values.

```bash
formatjs extract "src/**/*.rs" --out-file messages.json
```

Python extraction reads explicit `define_message` declarations and inline
`format_message` calls. `id` is optional; missing IDs use
`[sha512:contenthash:base64:10]`. Descriptor fields must be string literals;
`values` may be dynamic mappings or arbitrary keyword arguments. Descriptor
objects declared elsewhere are extracted from their `define_message` call.

```python
from my_app.i18n import define_message

GREETING = define_message(
    id="greeting",
    default_message="Hello, {name}!",
    description="Greeting shown on the home page",
)

greeting = intl.format_message(
    default_message="Hello, {name}!",
    description="Greeting shown on the home page",
    name=user.name,
)
```

```bash
formatjs extract "src/**/*.py" --out-file messages.json
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

- `[FILES]...` - JavaScript, TypeScript, Rust, or Python glob patterns (e.g., `src/**/*.tsx`)
- `--format <FORMATTER>` - Built-in formatter controlling JSON output shape (`default`, `simple`, `transifex`, `smartling`, `lokalise`, or `crowdin`)
- `--in-file <PATH>` - File containing list of files to extract (one per line)
- `--out-file <PATH>` - Target file for aggregated .json output
- `--id-interpolation-pattern <PATTERN>` - Pattern to auto-generate message IDs (default: `[sha512:contenthash:base64:6]`)
- `--extract-source-location` - Extract metadata about message location in source
- `--additional-component-names <NAMES>` - Additional component names to extract from (comma-separated)
- `--additional-function-names <NAMES>` - Additional function names to extract from (comma-separated)
- `--ignore <PATTERNS>` - Glob patterns to exclude
- `--throws` - Exit with an error when input resolution, traversal, or extraction fails
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
  --ast
```

**Options:**

- `[TRANSLATION_FILES]...` - Glob patterns for translation files (e.g., `foo/**/en.json`)
- `--format <FORMATTER>` - Built-in formatter that converts input to `Record<string, string>` (`default`, `simple`, `transifex`, `smartling`, `lokalise`, or `crowdin`)
- `--out-file <PATH>` - Output file path (prints to stdout if not provided)
- `--ast` - Compile to AST instead of strings
- `--skip-errors` - Continue compiling after errors (excludes keys with errors)
- `--pseudo-locale <LOCALE>` - Generate pseudo-locale AST output; requires `--ast`
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
- `--format <FORMATTER>` - Built-in formatter (`default`, `simple`, `transifex`, `smartling`, `lokalise`, or `crowdin`)
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
- `--source-locale <LOCALE>` - Required for per-locale JSON (e.g., `en`); inferred from Apple catalogs
- `--ignore <PATTERNS>` - Glob patterns to ignore
- `--missing-keys` - Check for missing keys in target locales
- `--extra-keys` - Check for extra keys not in source locale
- `--structural-equality` - Check structural equality of messages

## Compatibility Notes

`formatjs_cli` is intended to match `@formatjs/cli` where the Rust implementation supports the same feature. Known differences include:

- `--format` accepts built-in formatter names only. The Node.js CLI can also load custom JavaScript formatter files.
- Extraction currently targets JavaScript and TypeScript source files. Framework template extraction for Vue, Svelte, Handlebars, Glimmer, GTS, and GJS is handled by the Node.js CLI.

## Development

### Running Tests

Using Bazel:

```bash
bazel test //crates/formatjs_cli:formatjs_cli_test
```

Tests live in standalone `*.test.rs` modules and exercise public APIs. Gazelle
collects them into one test target and generates the crate root through the
repository's test macro.

### Project Structure

```text
crates/formatjs_cli/
├── Cargo.toml
├── BUILD.bazel
├── lib.rs
├── main.rs
├── extract.rs
├── extract.test.rs
└── formatters/
    ├── mod.rs
    └── mod.test.rs
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
- **Batch processing**: Parallel file and message processing for large catalogs
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

### Java printf verification

Use Java Formatter syntax explicitly for Android-style messages:

```bash
formatjs verify "lang/*.json" \
  --source-locale en \
  --message-syntax java-printf \
  --missing-keys --extra-keys --structural-equality
```

`--message-syntax` defaults to `icu` and selects the grammar for `--structural-equality`.
Both the Rust binary and npm CLI use the same Rust Java printf validator.
Malformed source messages fail even when no target key matches; malformed target messages also fail.
Diagnostics identify locale, message ID and syntax error or incompatible argument requirement.

Resolved argument indices and their sets of conversion requirements must match.
Explicit reordering, repeated uses of the same argument, uppercase variants and compatible numeric/date presentation changes are allowed.
Missing or extra arguments and changed requirements fail.
String, boolean, hash, character, integer, floating-point and date/time uses are distinct; `%#s`, signed octal/hexadecimal flags and hexadecimal floats retain their narrower requirements.
Width/precision changes are allowed when Java syntax permits them. Runtime Java values/types and date fields are not inferred.

Input remains JSON catalogs with string leaves, optionally nested. This mode does not read Android XML.
Decode XML, skip `formatted="false"`, and emit each independently formatted plural/array item as its own message before verification.

### Apple Xcode catalog verification

```sh
formatjs verify 'Resources/**/*.xcstrings' \
  --message-syntax apple-printf --structural-equality --missing-keys
```

Apple mode accepts only `.xcstrings` versions 1.0/1.1. Rust and npm CLIs share
catalog loading and validation in Rust. Source language is inferred; an explicit
`--source-locale` must match `sourceLanguage`. Source values fall back to keys.

Nested plural/device variants and named substitutions use their catalog context.
`%#@name@` resolves via `argNum`/`formatSpecifier`; branch `%arg` uses its owning
argument. Plural categories may differ; selectors may be omitted. Other argument
types, lengths and dynamic width/precision roles must survive. Files namespace
independent string tables. `shouldTranslate: false` entries are skipped.

`--missing-keys` checks locales found across supplied catalogs. `--extra-keys`
has no additional effect on a catalog's shared key set. Translation states remain
metadata, not a completeness check. Validation never rewrites input.

Formatting is inferred from source argument specifiers or substitution metadata;
plain percentages remain literal. Whitespace after percent is ambiguous and alone
does not identify a format. Root plurals with multiple numeric arguments need
explicit substitution metadata; nested named substitutions and unknown axes fail
explicitly. Legacy `.strings`/`.stringsdict` and flat JSON are unsupported.
