# Bazel Toolchain Deep Dive

## Overview

The build system prioritizes **fast, parallel compilation** through separation of concerns: type checking (tsgo), transpilation (oxc-transform), and bundling (rolldown) are independent steps that can run in parallel across the monorepo.

## Bazel Version & Module System

**Bazel 9.0.1** with bzlmod (MODULE.bazel, not WORKSPACE). Pin in `.bazelversion`.

### Key Module Dependencies

| Dependency              | Version | Purpose                                  |
| ----------------------- | ------- | ---------------------------------------- |
| `aspect_rules_js`       | 3.0.3   | JS/Node.js build rules, npm resolution   |
| `aspect_rules_ts`       | 3.8.7   | ts_project type checking                 |
| `aspect_rules_esbuild`  | 0.25.1  | esbuild bundling (legacy, rolldown used) |
| `aspect_bazel_lib`      | 2.22.5  | copy_to_bin, write_source_files          |
| `rules_rust`            | 0.69.0  | Rust compilation + WASM                  |
| `rules_nodejs`          | 6.7.3   | Node.js toolchain                        |
| `buildifier_prebuilt`   | 8.5.1   | Starlark formatting                      |
| `gazelle`               | 0.48.0  | BUILD file generation                    |
| `toolchains_buildbuddy` | 0.0.4   | Remote execution toolchain               |

### Hermetic Node.js

Node 24.14.0 pinned with SHA256 hashes for 5 platforms (darwin_arm64, darwin_amd64, linux_arm64, linux_amd64, windows_amd64). Ensures identical runtime across developers and CI.

## Remote Cache & Execution (BuildBuddy)

- **Remote cache:** `grpcs://formatjs.buildbuddy.io`
- **Linux CI:** Full remote build execution (`--config=ci` → `--config=remote`)
- **macOS CI:** Cache-only, local execution (`--config=ci-darwin`)
- **Reason:** Rust/Bazel toolchain cross-compilation is harder on macOS; local builds + shared cache is faster than remote execution

## TypeScript Build Pipeline

### Two Compilation Patterns

**Pattern 1: formatjs_library packages** (28 npm-published packages)

```
Source .ts files
  ├─ tsgo (type check only, no emit) ──→ errors / pass
  └─ rolldown + rolldown-plugin-dts ──→ bundled .js + .js.map + .d.ts
```

**Pattern 2: ts_compile packages** (3 internal packages: ecma402-abstract, ecma262-abstract, editor)

```
Source .ts files
  ├─ tsgo (type check only, no emit) ──→ errors / pass
  └─ oxc-transform (per-file) ──→ individual .js + .d.ts files
```

### Why Separate Type Checking and Transpilation?

- **tsgo** (@typescript/native-preview): Native TypeScript type checker, parallel across projects, fast. Only checks types — no output.
- **oxc-transform**: Rust-based, ~100x faster than tsc for transpilation. Only strips types — no checking. Runs per-file in parallel.
- **Benefit:** Type checking and transpilation run independently and in parallel across the monorepo.

### TypeScript Configuration (tools/tsconfig.bzl)

Configs are Starlark dicts, not JSON files. The root `tsconfig.json` is generated from `BASE_TSCONFIG`.

| Config               | Target | Use                            |
| -------------------- | ------ | ------------------------------ |
| `BASE_TSCONFIG`      | ES2017 | Library packages               |
| `ESNEXT_TSCONFIG`    | ESNext | Polyfills, tests, Node tooling |
| `BASE_NODE_TSCONFIG` | ES2017 | Node-specific (+ types:node)   |
| `DOCS_TSCONFIG`      | ES2017 | Documentation (+ skipLibCheck) |

#### Key Compiler Options & Rationale

| Option                            | Value           | Rationale                                                          |
| --------------------------------- | --------------- | ------------------------------------------------------------------ |
| `module`                          | "esnext"        | Modern ESM output; tree-shakeable                                  |
| `moduleResolution`                | "bundler"       | Supports `#packages/*` paths, Node 12.20+                          |
| `target`                          | "ES2017" (base) | Safe baseline; async/await, spread syntax                          |
| `strict`                          | true            | Full type checking                                                 |
| `isolatedDeclarations`            | true            | Each file's .d.ts is standalone; enables parallel .d.ts generation |
| `verbatimModuleSyntax`            | true            | Preserve exact import/export syntax; TypeScript 5.0+               |
| `rewriteRelativeImportExtensions` | true            | Convert `./foo.ts` → `./foo.js` in output (ESM compat)             |
| `jsx`                             | "react-jsx"     | Modern React transform without `import React`                      |
| `preserveConstEnums`              | true            | Keep enum values in output (CLDR tools depend on this)             |
| `importHelpers`                   | false           | Don't use tslib; oxc handles helpers                               |

#### packages_tsconfig(base)

Dynamically calculates `#packages/*` path alias depth:

- `packages/intl-locale` (depth 2) → `"#packages/*": ["../../packages/*"]`
- `packages/ecma402-abstract/NumberFormat` (depth 3) → `"#packages/*": ["../../../packages/*"]`

## Custom Bazel Macros (tools/)

### ts_compile (tools/index.bzl)

```
ts_compile(name, srcs, deps, visibility, tsconfig)
  ├─ ts_project(name-esm-typecheck)  ← tsgo, no_emit=True (type check)
  ├─ ts_project(name-esm)            ← oxc_transpiler (.js + .d.ts)
  └─ js_library(name)                ← wraps output + package.json (if exists)
```

### ts_compile_node (tools/index.bzl)

Same as ts_compile but uses `packages_tsconfig(ESNEXT_TSCONFIG)` — includes `#packages/*` paths for downstream resolution of `#packages/` imports in `.d.ts` files.

### rolldown_bundle (tools/rolldown.bzl)

```
rolldown_bundle(name, entry_point, srcs, deps, external, format, target, dts, global_name, code_splitting)
  └─ js_run_binary(tools/rolldown-bundle.ts)
       ├─ resolves #packages/* via resolve.alias
       ├─ if dts=True: rolldown-plugin-dts generates bundled .d.ts
       └─ outputs: .js + .js.map (+ .d.ts if dts)
```

**How #packages/\* resolves in rolldown:**

1. `resolve.tsconfigFilename`: temp tsconfig with `"paths": {"#packages/*": ["packages/*"]}` and `baseUrl: workspaceRoot`. Uses oxc-resolver's TypeScript-aware resolution (.js → .ts/.tsx extension mapping).
2. dts plugin: same temp tsconfig with `isolatedDeclarations: true`

**External handling:** `["pkg"]` becomes regex `^pkg(/.*)?$` — matches both `pkg` and `pkg/subpath`.

### formatjs_library (tools/compile.bzl)

Wraps source files, type checking, bundling, and npm packaging into a single macro:

```
formatjs_library(name, srcs, deps, project_references, entry_points, types, npm_package_name, ...)
  ├─ copy_to_bin(name="srcs")         ← sandbox-safe source copy
  ├─ js_library(name="lib")           ← wraps sources + deps
  ├─ ts_project(name="typecheck")     ← tsgo, no_emit (type check)
  ├─ ts_project(name="types")         ← emit_declaration_only (if types=True)
  ├─ rolldown_bundle(name-bundle)     ← bundled .js + .d.ts
  └─ npm_package(name="pkg")          ← assembled package (if npm_package_name set)
```

**Gazelle manages:** `srcs`, `deps`, `project_references`

### formatjs_test (tools/test.bzl)

Vitest wrapper that auto-depends on `:lib` from `formatjs_library`:

```
formatjs_test(name, srcs, deps, **kwargs)
  └─ vitest(srcs=[":srcs"] + srcs, deps=deps + [":lib"], fixtures=auto, **kwargs)
```

- **Gazelle manages:** `srcs`, `deps`
- **Fixtures convention:** Files in `tests/fixtures/` are auto-discovered and passed to vitest. Gazelle skips `fixtures/` directories.

### vitest (tools/vitest.bzl)

```
vitest(name, srcs, deps, data, no_copy_to_bin, tsconfig, dom, snapshots, fixtures, config)
  ├─ ts_project(name_typecheck)   ← tsgo, type check only
  ├─ vitest_test(name)            ← actual test execution
  └─ vitest(name_snapshots)       ← snapshot update targets
```

**Test tsconfig overrides:**

- `skipLibCheck: true` — test deps may have broken types
- `types: ["node"]` — tests need Node.js globals
- `noUncheckedSideEffectImports: false` — locale data imports are untyped

**vitest.config.mjs:** `resolve.preserveSymlinks: true` is critical — Bazel creates symlink runfiles; resolving to real paths escapes the sandbox.

### Gazelle Extension (tools/gazelle/ts/)

Custom Go gazelle plugin that auto-generates and maintains `formatjs_library` and `formatjs_test` rules by parsing TypeScript imports with oxc (Rust).

**Source files (Go — tools/gazelle/ts/):**

| File            | Purpose                                                                            |
| --------------- | ---------------------------------------------------------------------------------- |
| `language.go`   | Plugin struct (`tsLang`) with state: lifecycle manager + pkg.json cache            |
| `lifecycle.go`  | `lifeCycleManager`: starts/stops oxc subprocess via `Before`/`DoneGeneratingRules` |
| `generate.go`   | `GenerateRules`: file scanning, import extraction, rule creation                   |
| `imports.go`    | `Imports`: registers rules in RuleIndex (exact + wildcard paths)                   |
| `resolve.go`    | `Resolve`: converts imports → Bazel labels, reads package.json                     |
| `config.go`     | `tsConfig` data struct for per-directory configuration                             |
| `configure.go`  | `Configure`: reads BUILD directives, manages config inheritance                    |
| `kinds.go`      | Rule type definitions, merge behavior, `Kinds()`, `Loads()`                        |
| `fix.go`        | `Fix`: post-processing hook (currently no-op)                                      |
| `parser.go`     | `ImportStatement` type + `extractImportsBatch` method                              |
| `parser_oxc.go` | `OxcParser` subprocess client (length-prefixed JSON over stdin/stdout)             |

**Source files (Rust — crates/ts_import_extractor/):**

| File                     | Purpose                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `src/main.rs`            | Subprocess main loop: stdin/stdout framing, rayon dispatch |
| `src/extract_imports.rs` | oxc AST visitor: extracts import paths from TS/TSX files   |
| `src/lib.rs`             | Public API re-exports for the library                      |

**Auto-generation behavior:**

- If a directory has `.ts`/`.tsx` source files → auto-creates `formatjs_library(name = "dist")`
- If a directory has test files → auto-creates `formatjs_test(name = "unit_test")`
- Gazelle's merge preserves manually-set attrs (entry_points, types, npm_package_name, etc.)
- Disable with `# gazelle:formatjs_enabled false` for directories with custom build rules

**What gazelle manages:**

| Rule               | Managed attrs                                                                  |
| ------------------ | ------------------------------------------------------------------------------ |
| `formatjs_library` | `srcs` + `visibility` (GenerateRules), `deps` + `project_references` (Resolve) |
| `formatjs_test`    | `srcs` (GenerateRules), `deps` (Resolve)                                       |

**Merge behavior (kinds.go):**

| Attr category   | Behavior                                             | Examples                     |
| --------------- | ---------------------------------------------------- | ---------------------------- |
| MergeableAttrs  | Merged with existing; `# keep` entries preserved     | `srcs`                       |
| ResolveAttrs    | Set by Resolve(), replacing existing values each run | `deps`, `project_references` |
| Set in Generate | Overwritten each run                                 | `visibility`                 |
| Not set         | Preserved from existing BUILD file                   | `entry_points`, `types`      |

**How srcs are generated:**

- Collects `.ts`/`.tsx` files from `args.RegularFiles` (includes subdirs without BUILD files)
- Partitions into source files and test files (`tests/`/`test/` prefix or `.test.ts` suffix)
- Test srcs also include `.json` data files under `tests/` (for locale data fixtures)
- Skips files under `fixtures/` directories (auto-discovered by `formatjs_test` macro)

**How deps are resolved (resolve.go):**

- Parses imports via oxc subprocess (parser_oxc.go → crates/ts_import_extractor)
- `#packages/*` imports → walked up path hierarchy → `project_references` (internal Bazel labels)
- `node:*` / Node builtins → `//:node_modules/@types/node`
- npm packages → `//:node_modules/<pkg>` (with auto `@types` detection)
- Only adds deps for packages found in root `package.json` (prevents non-existent targets)

**Oxc parser subprocess architecture:**

The plugin uses a subprocess model (not cgo/FFI) for calling Rust from Go. This avoids
cgo overhead, FFI memory management, `cc_library` chains, and dylib path issues.

```
Go (gazelle plugin)                     Rust (ts_import_extractor)
┌────────────────────────┐              ┌──────────────────────────────┐
│ parser_oxc.go          │  stdin       │ main.rs                      │
│   OxcParser struct     │ ────────────>│   length-prefixed protobuf   │
│   writeFrame/readFrame │  stdout      │   rayon parallel file parse  │
│   runfiles.Rlocation   │ <────────────│   oxc Visit AST walker       │
└────────────────────────┘              └──────────────────────────────┘
```

- **Protocol:** Length-prefixed protobuf frames over stdin/stdout.
  Schema: `crates/ts_import_extractor/proto/message.proto`
  Each frame: `[4-byte big-endian u32 length][protobuf payload]`
  Go uses `google.golang.org/protobuf/proto`, Rust uses `prost`.
- **Lifecycle:** Subprocess spawned in `lifeCycleManager.Before()` at plugin startup,
  shut down in `DoneGeneratingRules()`. Stays alive for entire gazelle run.
- **Binary discovery:** `runfiles.Rlocation("_main/crates/ts_import_extractor/bin")`.
  The binary is a `data` dep on the `go_library` rule.
- **Batching:** All TypeScript files in a directory are sent in one request (not per-file).
  rayon thread pool on the Rust side parses files within the batch in parallel.
- **Error handling:**
  - Go: `Before()` logs warning on startup failure; `extractImportsBatch()` returns nil map
    if parser unavailable — caller skips imports.
  - Rust: checks `ret.errors` after parsing — malformed files return `Err` with oxc diagnostics
    instead of extracting from partially-recovered ASTs (avoids incorrect dep graphs).
    Stdout write errors exit cleanly instead of panicking.
- **Rust optimization flags:** `panic=abort` (no unwind tables), `codegen-units=1` (better inlining).
  LTO is incompatible with rules_rust's `embed-bitcode=no` default.
- **oxc AST visitor:** Implements `Visit<'a>` trait, extracts from 4 node types:
  `ImportDeclaration`, `ExportNamedDeclaration`, `ExportAllDeclaration`, `ImportExpression`

**Performance (200 files, M4 Max, `bazel test -c opt`):**

| Metric    | Tree-sitter (old) | Oxc (current) | Improvement |
| --------- | ----------------- | ------------- | ----------- |
| Time/op   | 89.5ms            | 2.5ms         | ~36x faster |
| Memory/op | 32.2MB            | 165KB         | ~195x less  |
| Allocs/op | 323,058           | 1,283         | ~252x fewer |

**Three-phase pipeline:**

1. **GenerateRules** (generate.go): Scan `.ts`/`.tsx` files, extract imports via oxc subprocess, create rules with `srcs`
2. **Imports** (imports.go): Register each rule in the RuleIndex (exact + wildcard paths)
3. **Resolve** (resolve.go): Query RuleIndex to convert imports → Bazel labels, set `deps`/`project_references`

**Architecture pattern:** The plugin follows the same separation-of-concerns pattern as
[gazelle-ts-plugin](https://github.com/aspect-build/gazelle-ts-plugin):
stateful language struct with lifecycle management, one file per Gazelle interface method
(`generate.go`, `imports.go`, `resolve.go`, `configure.go`, `fix.go`), and config data
separate from config interface (`config.go` vs `configure.go`).

### generate_ide_tsconfig_json (tools/index.bzl)

Generates IDE tsconfig.json with:

- `#packages/*` path alias (depth-aware)
- `composite: true` if requested
- `references` from Bazel labels → relative tsconfig paths
- `exclude` auto-generated via `native.subpackages()` for child Bazel packages

### oxc_transpiler (tools/oxc_transpiler.bzl + tools/oxc-transpiler/index.mjs)

Custom Bazel rule wrapping oxc-transform:

- Input: `.ts` file → Output: `.js` + `.d.ts`
- Manually rewrites `./foo.ts` → `./foo.js` in imports (oxc doesn't have `rewriteRelativeImportExtensions`)
- Uses `onlyRemoveTypeImports: true` + `declaration: true`

**Known workaround:** Hardcoded `../../../` depth to escape bin directory (fragile if Bazel changes bin layout).

## Composite Sub-Packages

Internal packages like `ecma402-abstract` can be split into composite Bazel sub-packages:

```
packages/ecma402-abstract/
  BUILD.bazel           ← ts_compile (root files only)
  types/BUILD.bazel     ← ts_compile (type definitions)
  NumberFormat/BUILD.bazel ← ts_compile (NumberFormat AOs)
```

Each sub-package:

- Has `formatjs_library` (auto-generated by gazelle when `.ts` files exist)
- The macro auto-detects `package.json` via glob — no manual `package_json` attr needed
- Has `generate_ide_tsconfig_json(composite=True)`
- Parent auto-excludes children via `native.subpackages()` in tsconfig
- Consumers depend on sub-packages directly: `//packages/ecma402-abstract/types`

## .bazelrc Flags

### Project Flags

| Flag                                | Value                     | Rationale                    |
| ----------------------------------- | ------------------------- | ---------------------------- |
| `java_language_version`             | 17                        | ICU4J conformance tests      |
| `@aspect_rules_ts//ts:skipLibCheck` | honor_tsconfig            | Respect per-package tsconfig |
| `NODE_OPTIONS`                      | --max-old-space-size=4096 | Prevent OOM during bundling  |

### Aspect Best Practices (.aspect/bazelrc/)

**correctness.bazelrc:**

- `--sandbox_default_allow_network=false` — hermetic builds, no network in sandbox
- `--incompatible_strict_action_env` — no PATH leakage from host
- `--noremote_upload_local_results` — don't pollute shared cache with local builds
- `experimental_allow_tags_propagation` disabled — causes "conflicting actions" in this monorepo

**performance.bazelrc:**

- `--reuse_sandbox_directories` — avoid recreating sandbox dirs between actions
- `--nolegacy_external_runfiles` — no `.runfiles/wsname/external/` symlink forests

**debug.bazelrc:**

- `--config=debug` enables: streamed test output, exclusive strategy, no timeout

## Build Flow Example

Building `@formatjs/intl-locale:pkg`:

```
1. Module Resolution (MODULE.bazel)
   → Fetch npm packages, Rust crates, TypeScript

2. CLDR Data Generation
   → Rust tools generate locale data .json files

3. Type Checking (tsgo, no_emit=True)
   → Fast parallel type check via packages_tsconfig()
   → Resolves #packages/* via paths

4. Transpilation (oxc-transform)
   → Per-file .ts → .js + .d.ts
   → Rewrites ./foo.ts → ./foo.js

5. Bundling (rolldown)
   → Single pass: bundled .js + .js.map + .d.ts
   → #packages/* resolved via resolve.alias
   → dts plugin inlines types, strips #packages/ paths

6. npm_package Assembly
   → Collects .js, .d.ts, package.json, README, LICENSE

7. Root dist Target
   → copy_to_directory aggregates all :pkg targets
```

## Critical Rules

1. **Never run `bazel clean`** — destroys cache, 10+ minute rebuild penalty
2. **Always use Bazel** — not npm/yarn/pnpm for builds or tests
3. **Rust benchmarks need `-c opt`** — debug mode is 10x slower
4. **Commit messages must be Conventional Commits** — enforced by commitlint
5. **`@formatjs/ecma402-abstract` is not a valid commitlint scope** — use `deps`
