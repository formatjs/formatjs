# Rust Crate Dependency Hierarchy

## Workspace Members

The Rust workspace (`Cargo.toml`) contains 4 members:

```
crates/
  icu_skeleton_parser/         # Number/date skeleton parser
  icu_messageformat_parser/    # ICU MessageFormat parser (+ WASM target)
  formatjs_cli/                # CLI binary (extract, compile, verify)
packages/
  icu-messageformat-parser/integration-tests/   # Cross-language integration tests
```

## Dependency Graph

```
formatjs_cli (v0.1.14)
├── formatjs_icu_messageformat_parser (v0.2.4)
│   ├── formatjs_icu_skeleton_parser (v0.1.1)
│   │   ├── regex 1.12
│   │   ├── serde 1.0
│   │   ├── serde_json 1.0
│   │   └── once_cell 1.21
│   ├── icu 2.1 (Unicode ICU)
│   ├── regex 1.11
│   ├── serde + serde_json
│   ├── once_cell, indexmap
│   └── [WASM only] wasm-bindgen 0.2, serde-wasm-bindgen 0.6
├── formatjs_icu_skeleton_parser (v0.1.1)
├── clap 4.5 (CLI argument parsing)
├── oxc 0.120 + oxc_parser + oxc_ast + oxc_allocator + oxc_span (JS/TS parsing)
├── serde + serde_json (serialization)
├── sha2, base64, hex (hashing for ID generation)
├── fast-glob 1.0, walkdir 2 (file discovery)
├── anyhow (error handling)
└── regex 1.12
```

## Crate Details

### `formatjs_icu_skeleton_parser` (v0.1.1)

**Purpose:** Parses ICU number and datetime skeleton strings into structured options.

**Key modules:**

- `datetime_parser.rs` — Parses datetime skeletons (e.g., `yMMMd`)
- `number_parser.rs` — Parses number skeletons (e.g., `currency/USD`)
- `*_format_options.rs` — Type definitions for format options

**Exports:** `parse_date_time_skeleton()`, `parse_number_skeleton()`

### `formatjs_icu_messageformat_parser` (v0.2.4)

**Purpose:** High-performance Rust implementation of the ICU MessageFormat parser. 2.6-3.7x faster than the JavaScript implementation.

**Key modules:**

- `parser.rs` — Recursive descent parser (core logic)
- `types.rs` — AST node types (LiteralElement, ArgumentElement, PluralElement, etc.)
- `printer.rs` — AST-to-string serialization
- `manipulator.rs` — AST transforms (hoist_selectors, structural equality)
- `date_time_pattern_generator.rs` — CLDR datetime pattern generation
- `lib_wasm.rs` — WebAssembly bindings via wasm-bindgen

**Build targets:**

- **Native library** — Standard Rust library for use by formatjs_cli
- **WASM binary** — Compiled to `wasm32-unknown-unknown`, produces `.wasm` + JS glue via `rust_wasm_bindgen`
- **Benchmark** — Criterion-based (`bazel run -c opt //crates/icu_messageformat_parser:comparison_bench`)

**Generated files** (from TypeScript tooling):

- `time_data_generated.rs` — CLDR time zone data
- `regex_generated.rs` — Unicode category regex patterns

**Performance (vs JavaScript, `-c opt`):**

| Message type | Rust    | JavaScript | Speedup |
| ------------ | ------- | ---------- | ------- |
| complex_msg  | 9.22 us | 23.85 us   | 2.6x    |
| normal_msg   | 1.14 us | 3.27 us    | 2.9x    |
| simple_msg   | 163 ns  | 600 ns     | 3.7x    |
| string_msg   | 118 ns  | 320 ns     | 2.7x    |

### `formatjs_cli` (v0.1.14)

**Purpose:** Drop-in Rust replacement for `@formatjs/cli`. 17x faster than the Node.js CLI.

**Binary:** `formatjs`

**Commands:**

1. **extract** — Extract messages from JS/TS/JSX/TSX source files
2. **compile** — Compile translation files to ICU format
3. **compile-folder** — Batch compilation from directories
4. **verify** — Validate translations (missing keys, extra keys, structural equality)

**Key implementation details:**

- Uses **oxc** (v0.120) for JS/TS/JSX/TSX AST parsing (no Node.js dependency)
- **Whitespace normalization** (`extractor.rs`): Matches TypeScript CLI behavior exactly, including U+00A0 (non-breaking space) preservation via placeholder technique
- **ID generation** (`id_generator.rs`): SHA512 + base64 encoding, webpack loader-utils compatible. Hash is computed AFTER flattening (matching TypeScript CLI order)
- **6 output formatters:** default, simple, crowdin, lokalise, transifex, smartling

**176 unit tests.** Integration tests via `packages/cli/integration-tests/` ensure 100% conformance with the TypeScript CLI (60/60 tests passing).

## Connection to TypeScript Packages

| Rust Crate                 | TypeScript Package                   | Relationship                        |
| -------------------------- | ------------------------------------ | ----------------------------------- |
| `icu_skeleton_parser`      | `@formatjs/icu-skeleton-parser`      | Rust mirror of TS implementation    |
| `icu_messageformat_parser` | `@formatjs/icu-messageformat-parser` | Rust mirror, also compiled to WASM  |
| `formatjs_cli`             | `@formatjs/cli`                      | Drop-in replacement for Node.js CLI |

**Data flow:** TypeScript scripts in `packages/icu-messageformat-parser/tools/` generate Rust source files (`time_data_generated.rs`, `regex_generated.rs`) from CLDR data. These are checked in and used by the Rust crate at compile time.

## Cross-Platform Builds

The CLI supports multiple platforms via Bazel platform transitions:

```bash
# macOS ARM64
bazel build --compilation_mode=opt --platforms=//crates/formatjs_cli/platforms:darwin_arm64 //crates/formatjs_cli

# Linux x86_64
bazel build --compilation_mode=opt --platforms=//crates/formatjs_cli/platforms:linux_x86_64 //crates/formatjs_cli
```

GitHub Actions (`rust-cli-release.yml`) builds and publishes binaries for both platforms on tag push.
