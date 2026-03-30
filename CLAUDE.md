# Instructions for Claude Code

## Knowledge Base

For detailed architecture docs, package dependency hierarchies, CLDR data pipelines, and design decisions, consult `knowledge-base/`. Key docs:

- `001-repo-layout-and-toolchain.md` — Directory structure, Bazel, TypeScript/Rust toolchains, CI/CD
- `002-ts-package-dependency-hierarchy.md` — 5-layer TypeScript package dependency graph
- `003-rust-crate-dependency-hierarchy.md` — Rust crates, WASM, cross-language connections
- `004-009` — Per-package design decisions and ECMA-402 conformance details
- `007a-007k` — Individual polyfill CLDR data pipelines
- `migrations/` — Migration plans (e.g., gazelle migration)

## Critical Rules

### 1. NEVER Run `bazel clean`

- **NEVER** run `bazel clean` or `bazel clean --expunge`
- Destroys build cache, 10+ minute rebuild penalty
- Use specific targets instead: `bazel build //path/to:target`

### 2. Always Use Bazel

This repository uses Bazel as its build system. Never use `npm`, `yarn`, or `pnpm` for building or testing.

```bash
bazel test //...                                          # All tests
bazel test //packages/intl-localematcher:unit_test        # Specific package
bazel build //packages/intl-localematcher:dist            # Build package
bazel test <target> --test_output=all                     # Verbose output
bazel query 'kind(test, //packages/...)'                  # Query test targets
```

### 3. Rust Benchmarks Need `-c opt`

Always use `bazel run -c opt` for Rust benchmarks. Debug mode is ~10x slower.

```bash
bazel run -c opt //crates/icu_messageformat_parser:comparison_bench
```

### 4. Polyfill Development

- Cross-check with the [LDML spec](https://unicode.org/reports/tr35/) and [ICU4J](https://unicode-org.github.io/icu-docs/apidoc/released/icu4j/) source
- Each polyfill follows ECMA-402 strictly
- Data is tree-shakeable — locale data is separately importable
- See `knowledge-base/007*.md` for per-polyfill CLDR pipeline details

### 5. Commit Message Format

[Conventional Commits](https://www.conventionalcommits.org/) — enforced by commitlint.

```
<type>(<scope>): <subject>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

**Scope:** Full package name from package.json (e.g., `@formatjs/cli`, `@formatjs/intl-localematcher`)

**Breaking changes:** Append `!` after scope or add `BREAKING CHANGE:` footer.

## Quick Reference

- **Packages**: `packages/` (33 npm packages)
- **Rust crates**: `crates/` (3 crates: CLI, parser, skeleton parser)
- **Custom Bazel macros**: `tools/` (ts_compile, vitest, oxc_transpiler, etc.)
- **Conformance tests**: `bazel test //packages/cli/integration-tests:conformance_test`
- **Rust CLI tests**: `bazel test //crates/formatjs_cli:formatjs_cli_test` (176 tests)
- **Rust CLI conformance**: 60/60 passing (packages/cli/integration-tests/conformance-tests/)
