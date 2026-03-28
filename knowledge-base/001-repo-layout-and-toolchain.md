# Repo Layout, Toolchain & Dev Setup

## Directory Structure

```
formatjs/
  packages/           # 33 npm packages (polyfills, parsers, integrations, tools)
  crates/             # 3 Rust crates (CLI, parser, skeleton parser)
  tools/              # Custom Bazel macros (ts_compile, vitest, oxc_transpiler)
  docs/               # Documentation site (Vike + React + MDX)
  benchmarks/         # Cross-tool benchmarks (Rust CLI vs TS CLI)
  conformance-tests/  # ICU4J conformance testing
  knowledge-base/     # Architecture docs and migration plans
  patches/            # pnpm patches for upstream deps
  .github/workflows/  # CI/CD (test, release, rust-cli-release, website)
  .aspect/bazelrc/    # Aspect-recommended Bazel settings
```

## Build System: Bazel (bzlmod)

**Version:** Bazel 9.0.1 (`.bazelversion`)

All builds go through Bazel. Never use `npm`/`yarn`/`pnpm` for building or testing directly.

### Key Bazel Dependencies (MODULE.bazel)

| Dependency              | Version | Purpose                                      |
| ----------------------- | ------- | -------------------------------------------- |
| `aspect_rules_js`       | 3.0.3   | JS/Node.js build rules                       |
| `aspect_rules_ts`       | 3.8.7   | TypeScript compilation                       |
| `aspect_rules_esbuild`  | 0.25.1  | esbuild bundling                             |
| `aspect_bazel_lib`      | 2.22.5  | copy_to_bin, write_source_files              |
| `rules_rust`            | 0.69.0  | Rust compilation + WASM                      |
| `rules_nodejs`          | 6.7.3   | Node.js toolchain                            |
| `buildifier_prebuilt`   | 8.5.1   | Starlark formatting                          |
| `gazelle`               | 0.48.0  | BUILD file generation (scaffolded, disabled) |
| `rules_multitool`       | 1.11.1  | Prebuilt binary management                   |
| `toolchains_buildbuddy` | 0.0.4   | Remote execution toolchain                   |

### Remote Cache & Execution

BuildBuddy provides remote caching for all CI builds and remote execution for Linux CI:

- **Remote cache:** `grpcs://formatjs.buildbuddy.io`
- **Remote executor:** Same endpoint, Linux x86_64 only
- **CI configs:** `--config=ci` (Linux, full RBE) and `--config=ci-darwin` (macOS, cache only)

### Custom Bazel Macros (tools/)

| Macro               | File                 | Expands To                                                              |
| ------------------- | -------------------- | ----------------------------------------------------------------------- |
| `ts_compile`        | `index.bzl`          | ts_project (typecheck, tsgo) + ts_project (transpile, oxc) + js_library |
| `ts_compile_node`   | `index.bzl`          | Same as ts_compile with ESNEXT_TSCONFIG                                 |
| `vitest`            | `vitest.bzl`         | ts_project (typecheck) + vitest_test + snapshot targets                 |
| `ts_binary`         | `index.bzl`          | js_binary with `--experimental-transform-types`                         |
| `generate_src_file` | `index.bzl`          | ts_run_binary + oxfmt + write_source_files                              |
| `oxc_transpiler`    | `oxc_transpiler.bzl` | Custom rule: .ts -> .js + .d.ts via oxc-transform                       |

## Package Management: pnpm

**Version:** pnpm 10.4.1 (pinned in MODULE.bazel), 10.32.1 (root package.json)

- `pnpm-workspace.yaml` defines workspace packages
- `npm_translate_lock` in MODULE.bazel converts `pnpm-lock.yaml` to Bazel deps
- 5 pnpm patches in `patches/` for upstream compatibility

## TypeScript Toolchain

**TypeScript:** 6.0.2

The build uses a dual typecheck + transpile pattern for speed:

1. **Typecheck:** `@typescript/native-preview` (tsgo) — fast parallel type checking, no emit
2. **Transpile:** `oxc-transform` 0.120.0 — generates .js + .d.ts files

TypeScript configs are defined as Starlark dicts in `tools/tsconfig.bzl`:

| Config               | Target                | Use                            |
| -------------------- | --------------------- | ------------------------------ |
| `BASE_TSCONFIG`      | ES2017                | Library packages               |
| `ESNEXT_TSCONFIG`    | ESNext                | Polyfills, tests, Node tooling |
| `BASE_NODE_TSCONFIG` | ES2017 + types:node   | Node-specific packages         |
| `DOCS_TSCONFIG`      | ES2017 + skipLibCheck | Documentation site             |

Key compiler options: `strict`, `isolatedDeclarations`, `verbatimModuleSyntax`, `rewriteRelativeImportExtensions`, `jsx: react-jsx`

## Rust Toolchain

**Rust:** Edition 2024, version 1.90.0

- **Targets:** Native (darwin_arm64, linux_x86_64) + `wasm32-unknown-unknown`
- **Crate management:** `crate_universe` generates Bazel rules from `Cargo.lock`
- **WASM:** `rules_rust_wasm_bindgen` for JS interop
- **Benchmarks:** Always use `bazel run -c opt` for release optimizations

## Linting & Formatting

| Tool       | Version          | Scope                  | Config              |
| ---------- | ---------------- | ---------------------- | ------------------- |
| oxfmt      | 0.41.0           | JS/TS/CSS/JSON/YAML/MD | `.oxfmtrc.json`     |
| oxlint     | 1.48.0           | JS/TS linting          | `.oxlintrc.json`    |
| buildifier | 8.5.1            | Bazel files            | Built-in            |
| rustfmt    | (via rules_rust) | Rust files             | Built-in            |
| commitlint |                  | Commit messages        | `.commitlintrc.mjs` |
| syncpack   | 14.0.0           | Dependency versions    | `.syncpackrc.json`  |

## Git Hooks (lefthook)

Pre-commit hooks run sequentially:

1. `format-rust` — rustfmt on staged .rs files
2. `format-package-json` — syncpack fix + format
3. `format-oxfmt` — oxfmt on staged files
4. `format-starlark` — buildifier on BUILD/bzl files
5. `gazelle` — regenerate BUILD files (currently no-op, JS disabled)
6. `lint-staged` — oxlint --fix
7. `bazel-lock-regen` — bazel mod deps

Commit-msg hook: `commitlint` validates Conventional Commits format.

## CI/CD (GitHub Actions)

| Workflow               | Trigger               | What it does                             |
| ---------------------- | --------------------- | ---------------------------------------- |
| `test.yml`             | PR, push to main      | `bazel test //...` on Ubuntu + macOS     |
| `rust-cli-release.yml` | Tag `formatjs_cli_v*` | Cross-platform Rust binary release       |
| `release.yml`          | Push to main          | `bazel build :dist` then `pnpm publish`  |
| `prerelease.yml`       | Manual                | `lerna version` (independent versioning) |
| `website.yml`          | Manual/push           | Deploy docs site                         |
| `verify-hooks.yml`     | PR                    | Verify lefthook hooks work               |

## Common Commands

```bash
# Install deps
pnpm install

# Run all tests
pnpm t                # syncpack lint + oxlint + bazel test //...

# Build everything
bazel build //...

# Test specific package
bazel test //packages/intl-localematcher:unit_test --test_output=all

# Build specific package
bazel build //packages/intl-localematcher:dist

# Run benchmarks (Rust — must use -c opt)
bazel run -c opt //crates/icu_messageformat_parser:comparison_bench

# Format all files
pnpm format           # runs lefthook pre-commit --all-files

# Run docs site
bazel run //docs:serve

# Query test targets
bazel query 'kind(test, //packages/...)'
```

## Critical Rules

1. **Never run `bazel clean`** — destroys cache, 10+ minute rebuild penalty
2. **Always use Bazel** — not npm/yarn/pnpm for builds or tests
3. **Rust benchmarks need `-c opt`** — debug mode is 10x slower
4. **Commit messages must be Conventional Commits** — enforced by commitlint
