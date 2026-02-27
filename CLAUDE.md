# Instructions for Claude Code

## Critical Rules

### 1. NEVER Run `bazel clean`

- **NEVER** run `bazel clean` or `bazel clean --expunge` in this repository
- These commands destroy the build cache and significantly slow down builds (can take 10+ minutes to rebuild)
- If you need to rebuild something, use specific targets instead: `bazel build //path/to:target`

### 2. Always Use Bazel Commands

This repository uses Bazel as its build system. Always use `bazel` commands, not `npm`, `yarn`, or `pnpm` directly.

**Common commands:**

```bash
# Run all tests
bazel test //...

# Run tests for a specific package
bazel test //packages/intl-localematcher:unit_test

# Build a package
bazel build //packages/intl-localematcher:dist

# Build all packages
bazel build //packages/...

# Run a benchmark (JS/TS)
bazel run //packages/intl-localematcher/benchmark:benchmark
bazel run //packages/intl-localematcher/benchmark:bestfit_benchmark

# Run with profiling
bazel run //packages/intl-localematcher/benchmark:profile_cpu

# Test with verbose output
bazel test //packages/intl-localematcher:unit_test --test_output=all
bazel test <target> --test_output=errors

# Query test targets
bazel query 'kind(test, //packages/...)'
```

### 3. Package Structure

- Packages are located in `packages/`
- Each package has:
  - `BUILD.bazel` - Bazel build configuration
  - `package.json` - npm package metadata
  - `src/` - Source code
  - `tests/` - Unit tests
  - `benchmark/` (optional) - Performance benchmarks
- Rust crates are in `crates/`

### 4. Polyfill Development

- When working on polyfills, always cross-check with the [LDML spec](https://unicode.org/reports/tr35/) and [ICU4J](https://unicode-org.github.io/icu-docs/apidoc/released/icu4j/) source
- Each Intl polyfill follows the ECMA-402 specification
- Polyfills only activate when native support is missing or buggy
- Uses CLDR data for locale-specific formatting rules
- Data is tree-shakeable and can be selectively imported

### 5. Testing

- Tests use Vitest and are defined in `BUILD.bazel` files
- Run all tests: `bazel test //...`
- Tests must pass before merging PRs
- Conformance tests: `bazel test //packages/cli/integration-tests:conformance_test`
- Rust CLI tests: `bazel test //crates/formatjs_cli:formatjs_cli_test`

### 6. Performance Benchmarks

- JS/TS benchmarks are in `packages/*/benchmark/` directories using `tinybench`
- Rust benchmarks are in `crates/*/benches/` directories using Criterion
- **CRITICAL**: Always use `-c opt` for Rust benchmarks to enable release optimizations
  - Example: `bazel run -c opt //crates/icu_messageformat_parser:comparison_bench`
  - Without `-c opt`, benchmarks run in debug mode and are ~10x slower
- Always verify performance after optimizations

### 7. Commit Message Format

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect the code's meaning (white-space, formatting, etc)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files

**Scope:** The scope should be the full package name from package.json (e.g., `@formatjs/cli`, `@formatjs/cli-lib`, `@formatjs/ts-transformer`, `@formatjs/intl-localematcher`)

**Examples:**
```bash
feat(@formatjs/cli): add support for custom extractors
fix(@formatjs/cli-lib): respect throws flag in extract() function
test(@formatjs/cli): add integration tests for throws flag
docs(@formatjs/cli): update README with new options
perf(@formatjs/intl-localematcher): optimize lookup algorithm
```

**Breaking Changes:**
If a commit introduces a breaking change, add `BREAKING CHANGE:` in the footer or append `!` after the type/scope:
```bash
feat(@formatjs/cli)!: remove deprecated --legacy flag

BREAKING CHANGE: The --legacy flag has been removed. Use --new-flag instead.
```

## Repository Context

### Overview

FormatJS is a set of libraries that provide internationalization (i18n) support for JavaScript/TypeScript applications. The repository is a monorepo managed with Bazel, containing multiple npm packages that work together to provide comprehensive i18n functionality.

**Website**: https://formatjs.io
**GitHub**: https://github.com/formatjs/formatjs
**Documentation**: https://formatjs.io/docs/getting-started/installation

### Main Packages

#### Core Internationalization Packages

- **`@formatjs/intl`** - Main package that provides ICU MessageFormat support
- **`@formatjs/intl-localematcher`** - Implements UTS #35 locale matching algorithms (BestFit and Lookup matchers)
  - Recently optimized for 439x performance improvement (issue #4936)
  - Handles complex locale matching: exact matches, maximization, fallbacks, and CLDR distance calculations
  - Critical for all other Intl polyfills
- **`@formatjs/ecma402-abstract`** - Shared ECMA-402 abstract operations used by all polyfills

#### Intl Polyfills

These packages provide polyfills for Intl APIs that may not be available in all environments:

- **`@formatjs/intl-numberformat`** - Number formatting (Intl.NumberFormat)
- **`@formatjs/intl-datetimeformat`** - Date/time formatting (Intl.DateTimeFormat)
- **`@formatjs/intl-durationformat`** - Duration formatting (Intl.DurationFormat)
- **`@formatjs/intl-relativetimeformat`** - Relative time formatting (Intl.RelativeTimeFormat)
- **`@formatjs/intl-listformat`** - List formatting (Intl.ListFormat)
- **`@formatjs/intl-pluralrules`** - Plural rules (Intl.PluralRules)
- **`@formatjs/intl-displaynames`** - Display names (Intl.DisplayNames)
- **`@formatjs/intl-segmenter`** - Text segmentation (Intl.Segmenter)
- **`@formatjs/intl-locale`** - Locale information (Intl.Locale)
- **`@formatjs/intl-getcanonicallocales`** - Canonical locale names

#### Framework Integrations

- **`react-intl`** - React components and hooks for i18n
- **`vue-intl`** - Vue.js integration

#### Developer Tools

- **`@formatjs/cli`** - Command-line tools for message extraction and compilation
- **`babel-plugin-formatjs`** - Babel plugin for compile-time message extraction
- **`@formatjs/ts-transformer`** - TypeScript transformer for message extraction
- **`eslint-plugin-formatjs`** - ESLint rules for i18n best practices

#### Parsers

- **`@formatjs/icu-messageformat-parser`** - ICU MessageFormat parser (JavaScript/TypeScript)
  - High-performance hand-written parser
  - Used at runtime for message parsing
- **`crates/icu_messageformat_parser`** - Rust implementation of ICU MessageFormat parser
  - **2.6-3.7x faster than JavaScript** parser (with optimized build)
  - Used for WASM compilation and native tooling
  - Run benchmarks: `bazel run -c opt //crates/icu_messageformat_parser:comparison_bench`
- **`@formatjs/icu-skeleton-parser`** - Number/date skeleton parser

### Architecture & Key Concepts

#### 1. Locale Matching (Recent Focus)

The `intl-localematcher` package implements a three-tier optimization for locale matching:

- **Tier 1**: O(1) exact match using Set lookup
- **Tier 2**: Maximization + progressive subtag removal fallback
- **Tier 3**: Full UTS #35 CLDR distance calculation with memoization

This optimization was critical for fixing issue #4936, where React Native/Hermes environments experienced 610ms delays when instantiating formatters with 700+ auto-loaded locales. The optimization reduced this to ~1.4ms (439x faster).

#### 2. Polyfill Strategy

- Each Intl polyfill follows the ECMA-402 specification
- Polyfills only activate when native support is missing or buggy
- Uses CLDR data for locale-specific formatting rules
- Data is tree-shakeable and can be selectively imported

#### 3. CLDR Data

- Uses Unicode CLDR (Common Locale Data Repository) for locale data
- Data files are generated from CLDR JSON and stored in `locale-data/` directories
- Supports 700+ locales from CLDR
- Scripts in `scripts/` directories generate locale data files

#### 4. Build System (Bazel)

- Uses Bazel for reproducible builds and caching
- BuildBuddy provides remote caching and execution for CI
- Each package has its own `BUILD.bazel` file
- Tests use Vitest via Bazel's vitest rule

### Rust CLI Development

- Location: `crates/formatjs_cli/`
- Binary: `bazel-bin/crates/formatjs_cli/formatjs_cli`
- 176 unit tests

### Conformance Testing (Rust CLI vs TypeScript CLI)

- Test suite: `packages/cli/integration-tests/conformance-tests/`
- 20 test cases, 60 total tests (20 TS CLI, 20 Rust CLI, 20 cross-comparisons)
- Current status: 60/60 passing (100% conformance)

**Key issues resolved:**

1. **Whitespace Normalization (#6021)**: `normalize_whitespace()` in `crates/formatjs_cli/src/extractor.rs` — normalizes newlines/tabs/multiple spaces to single spaces while preserving non-breaking spaces (U+00A0) via placeholder technique
2. **Hash Generation Timing**: TypeScript hashes AFTER flattening; Rust CLI must match — hash the flattened message in `crates/formatjs_cli/src/extract.rs`
3. **Non-Breaking Space**: `split_whitespace()` treats U+00A0 as whitespace; use placeholder replacement before/after normalization

### Formatter Output Differences

- **Crowdin**: `"message"` and `"description"` fields
- **Lokalise**: `"translation"` and `"notes"` fields
- **Transifex**: `"string"` and `"developer_comment"` fields
- **Smartling**: Adds metadata with `"string_format"`, `"translate_paths"`, `"variants_enabled"`

### Key Files

- `.bazelrc` - Bazel configuration (remote caching, build flags)
- `pnpm-workspace.yaml` - pnpm workspace configuration
- `pnpm-lock.yaml` - Dependency lockfile
- `MODULE.bazel` - Bazel module configuration (bzlmod)
- `BUILD.bazel` files - Per-package build configuration
- `package.json` files - npm package metadata

### Dependencies

- **Runtime**: No runtime dependencies (polyfills are self-contained)
- **Build Time**: Bazel, TypeScript, Vitest, CLDR data
- **Tooling**: pnpm for package management, BuildBuddy for remote caching

### Important Notes

- All polyfills are designed to be tree-shakeable
- Locale data can be selectively imported to reduce bundle size
- The repository follows ECMA-402 specifications strictly
- Performance is a key concern, especially for React Native/mobile environments
- Code changes should include tests and avoid breaking changes
