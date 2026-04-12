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
ts_compile(name, srcs, deps, visibility, tsconfig, package_json)
  ├─ ts_project(name-esm-typecheck)  ← tsgo, no_emit=True (type check)
  ├─ ts_project(name-esm)            ← oxc_transpiler (.js + .d.ts)
  └─ js_library(name)                ← wraps output + optional package.json
```

- `package_json=False` for internal packages without package.json (e.g., ecma402-abstract)

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

### vitest (tools/vitest.bzl)

```
vitest(name, srcs, deps, data, no_copy_to_bin, tsconfig, dom, snapshots, config)
  ├─ ts_project(name_typecheck)   ← tsgo, type check only
  ├─ vitest_test(name)            ← actual test execution
  └─ vitest(name_snapshots)       ← snapshot update targets
```

**Test tsconfig overrides:**

- `skipLibCheck: true` — test deps may have broken types
- `types: ["node"]` — tests need Node.js globals
- `noUncheckedSideEffectImports: false` — locale data imports are untyped

**vitest.config.mjs:** `resolve.preserveSymlinks: true` is critical — Bazel creates symlink runfiles; resolving to real paths escapes the sandbox.

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

- Has `ts_compile` with `package_json=False`
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
