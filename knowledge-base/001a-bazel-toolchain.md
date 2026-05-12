# Bazel Toolchain Deep Dive

## Overview

The build uses Bazel/bzlmod to keep TypeScript, generated data, Rust crates, and
published npm packages under one dependency graph. The TypeScript pipeline keeps
type checking, transpilation, bundling, testing, and package assembly as separate
actions so they can cache and run independently across the monorepo.

## Bazel Version & Module System

**Bazel 9.1.0** is pinned in `.bazelversion`. The repo uses bzlmod
(`MODULE.bazel`); there is no active WORKSPACE-based dependency setup.

### Key Module Dependencies

| Dependency              | Version / pin             | Purpose                                           |
| ----------------------- | ------------------------- | ------------------------------------------------- |
| `aspect_rules_js`       | 3.0.3                     | JS/Node.js rules, npm lock translation            |
| `rules_nodejs`          | 6.7.4                     | Hermetic Node.js toolchain                        |
| `aspect_rules_ts`       | 3.8.7                     | `ts_project`, tsgo integration                    |
| `aspect_bazel_lib`      | 2.22.5                    | `copy_to_bin`, `copy_to_directory`, source writes |
| `rules_multirun`        | 0.13.0                    | Multi-target run orchestration                    |
| `buildifier_prebuilt`   | 8.5.1.2                   | Starlark formatting                               |
| `protobuf`              | 34.0.bcr.1                | Proto runtime for Rust/Go tooling                 |
| `rules_proto`           | 7.1.0                     | Proto rules                                       |
| `rules_go`              | 0.60.0                    | Go SDK/rules for Gazelle                          |
| `gazelle`               | 0.50.0                    | BUILD file generation driver                      |
| `gazelle_ts`            | 0.3.3 + git override      | TypeScript Gazelle extension                      |
| `rules_rs`              | 0.0.61 + archive override | Rust compilation, crates, wasm                    |
| `llvm`                  | 0.7.5                     | LLVM toolchain support for Rust/wasm paths        |
| `rules_java`            | 9.6.1                     | Java toolchain for ICU4J conformance tests        |
| `toolchains_buildbuddy` | 0.0.4                     | BuildBuddy RBE C/C++ toolchain                    |

`gazelle_ts` is overridden to commit
`e3579a043d2639b85877c051f3fedd2095a4b1a2` for the post-0.3.3 abstract-kind
renames and `ts_bundler_config` / `ts_binary` additions. `rules_rs` is overridden
to the v0.0.61 GitHub release because it is not available from BCR yet.

### Hermetic Runtime Toolchains

- Node.js is pinned to **24.14.0** with SHA256 hashes for darwin arm64/x64,
  linux arm64/x64, and windows x64.
- Bazel's pnpm extension is pinned to **pnpm 10.4.1** for repository rules.
- TypeScript comes from root `package.json` through
  `@aspect_rules_ts//ts:extensions.bzl`.
- Go SDK is pinned to **1.24.12**.
- Rust is pinned to **1.95.0**, edition **2024**, through `rules_rs`.

## Remote Cache & RBE

- **Remote cache:** `grpcs://formatjs.buildbuddy.io`
- **Linux CI:** `--config=ci` expands to `--config=rbe`, enabling BuildBuddy RBE
  and remote cache.
- **macOS CI:** `--config=ci-darwin` uses BuildBuddy BES and remote cache only.
- **Remote platform:** `//platforms:buildbuddy_linux_x86_64_gnu` with
  `@toolchains_buildbuddy//toolchains/cc:ubuntu_gcc_x86_64`.

## TypeScript Build Pipeline

### Published Packages

The 29 package directories in `PACKAGES_TO_DIST` are assembled through
`formatjs_library()` in `tools/compile.bzl`.

```
Source .ts/.tsx files
  ├─ copy_to_bin(:srcs)                 → sandbox-safe source tree
  ├─ ts_project(:typecheck)             → tsgo, no emit
  ├─ js_library(:lib)                   → source library for tests
  ├─ rolldown_bundle(<entry>-bundle)    → bundled .js + .js.map + .d.ts
  ├─ validation tests                   → no internal imports, package deps, exports
  └─ npm_package(:pkg)                  → publishable package
```

Published packages are detected by the presence of a package-local
`package.json`. Bundling is done per `entry_points` with Rolldown and
`rolldown-plugin-dts`.

### Internal TypeScript Packages

Directories without package-local `package.json` still use `formatjs_library()`,
but take the internal path:

```
Source .ts/.tsx files
  ├─ copy_to_bin(:srcs)
  ├─ ts_project(:typecheck)  → tsgo, no emit
  ├─ ts_project(<dir>-esm)   → oxc transpilation + declarations
  ├─ js_library(<dir>)
  └─ alias(:lib)
```

This is used by composite internal packages such as
`packages/ecma402-abstract/types`, `NumberFormat`, `DateTimeFormat`, and related
abstract-operation subpackages.

### Why Separate Type Checking and Transpilation?

- **tsgo** (`@typescript/native-preview`) performs fast type checking and is
  always run with `no_emit = True` in the main typecheck path.
- **oxc-transform** is used for per-file TypeScript stripping and declaration
  generation where package-level bundling is not needed.
- **Rolldown** produces the published package bundles and bundled declarations.

This split lets type checking, package bundling, internal transpilation, and
tests cache independently.

## TypeScript Configuration

`tools/tsconfig.bzl` is the source of truth. Root `tsconfig.json` is generated
from `BASE_TSCONFIG` via the `:tsconfig_sync` target.

| Config                           | Target / use                                   |
| -------------------------------- | ---------------------------------------------- |
| `BASE_TSCONFIG`                  | ES2017 library baseline                        |
| `BASE_NODE_TSCONFIG`             | Base + `types: ["node"]`                       |
| `ESNEXT_TSCONFIG`                | ESNext target/lib for tests and modern tooling |
| `NODE_TSCONFIG`                  | ES2021 target for Node-specific contexts       |
| `DOCS_TSCONFIG`                  | Base + `skipLibCheck` for docs dependencies    |
| `ESNEXT_SKIP_LIB_CHECK_TSCONFIG` | ESNext + `skipLibCheck`                        |

Key compiler options:

| Option                            | Value         | Rationale                                         |
| --------------------------------- | ------------- | ------------------------------------------------- |
| `module`                          | `esnext`      | ESM output                                        |
| `moduleResolution`                | `bundler`     | Modern package/subpath resolution                 |
| `target`                          | `ES2017` base | Library baseline                                  |
| `strict`                          | `true`        | Full type checking                                |
| `isolatedDeclarations`            | `true`        | Declaration generation can be parallelized        |
| `verbatimModuleSyntax`            | `true`        | Preserve import/export syntax                     |
| `rewriteRelativeImportExtensions` | `true`        | `.ts` source imports become `.js` runtime imports |
| `jsx`                             | `react-jsx`   | Modern React JSX transform                        |
| `preserveConstEnums`              | `true`        | CLDR/data tooling depends on const enum behavior  |
| `importHelpers`                   | `false`       | Avoid `tslib` helper dependency                   |

`packages_tsconfig()` adds a depth-aware `#packages/*` path mapping for the
current Bazel package.

## Gazelle

The repo uses upstream `gazelle_ts` rather than an in-tree TypeScript Gazelle
plugin.

Root `BUILD.bazel` configures:

```starlark
gazelle_binary(
    name = "gazelle_bin",
    languages = ["@gazelle_ts//ts"],
)
```

`gazelle_ts` emits abstract `ts_library` and `ts_test` rules. Root directives
map those into local wrappers:

```starlark
# gazelle:map_kind ts_library formatjs_library //tools:compile.bzl
# gazelle:map_kind ts_test formatjs_test //tools:test.bzl
# gazelle:ts_npm_link_pattern //:node_modules/{pkg}
```

That means Gazelle owns ordinary source/test file discovery and dependency
resolution, while local macros keep the FormatJS build semantics.

### Generated Package Imports

Generated data packages under `@formatjs_generated/*` are not listed in root
`package.json`, so root `BUILD.bazel` uses a native Gazelle regexp override:

```starlark
# gazelle:resolve_regexp ts ^@formatjs_generated/([^/]+)(?:/.*)?$ //:node_modules/@formatjs_generated/$1
```

Generated package dependencies are ordinary `deps` labels under
`//:node_modules/@formatjs_generated/...`.

## Custom Bazel Macros

### `formatjs_library()` (`tools/compile.bzl`)

Consumes Gazelle's mapped `ts_library` output.

- `srcs` and combined `deps` are Gazelle-managed.
- `deps` contains both npm labels and internal package labels.
- `_partition_deps()` splits npm labels from internal project references.
- Published packages bundle with Rolldown and create `:pkg`.
- Internal packages transpile per file with `oxc_transpiler`.
- `@formatjs_generated/*` npm labels are bundled inline and deliberately not
  added to Rolldown's external package list.

The macro also creates package validation tests:

- `no_internal_imports_test` checks bundled output for leaked `#packages/*`
  imports.
- `package_json_test` checks external bare imports against package metadata.
- `package_exports_test` checks `package.json` exports against package contents.

### `formatjs_test()` (`tools/test.bzl`)

Consumes Gazelle's mapped `ts_test` output. `gazelle_ts` provides a single
`data` list, so the wrapper partitions it into:

- test source files and JSON fixtures,
- Bazel dependency labels for type checking,
- runtime-only data labels such as `//:package.json`.

When a sibling `:lib` exists, tests use that source library instead of the
published bundle target. This avoids a package-local `package.json` shadowing the
root `package.json` needed for `#packages/*` runtime imports.

### `vitest()` (`tools/vitest.bzl`)

Defines a typechecked Vitest target:

```
vitest(name, srcs, deps, data, fixtures, dom, snapshots, config, tsconfig)
  ├─ ts_project(<name>_typecheck)  → tsgo, no emit
  ├─ vitest_test(<name>)           → actual test execution
  └─ <name>.update                 → manual snapshot update helper
```

Test typecheck config adds:

- `skipLibCheck: true`
- `types: ["node"]`
- `noUncheckedSideEffectImports: false`

`//tools:vitest_config_mjs` is the default test config. It must preserve symlinks
because Bazel test runfiles are symlink-heavy.

### `rolldown_bundle()` (`tools/rolldown.bzl`)

Wraps `js_run_binary("//tools:rolldown-bundle-bin")`.

- One-output mode emits `<output>.js` and `<output>.js.map`.
- `dts = True` or code splitting uses an output directory.
- External packages are passed with repeated `--external`.
- Published package bundles use `dts = True`.

The backing TypeScript script handles `#packages/*` workspace resolution and
delegates declaration bundling to `rolldown-plugin-dts`.

### `ts_compile()` / `ts_compile_node()` (`tools/index.bzl`)

Legacy/general helper macros still exist for custom TS compilation:

```
ts_compile(name)
  ├─ ts_project(<name>-esm-typecheck)  → tsgo, no emit
  ├─ ts_project(<name>-esm)            → oxc transpiler + declarations
  └─ js_library(name)
```

`ts_compile_node()` uses `ESNEXT_TSCONFIG` and supports additional runtime data.
Most package BUILD files now use `formatjs_library()` instead.

### `generate_ide_tsconfig_json()` (`tools/index.bzl`)

Generates per-package `tsconfig.json` files.

- Extends the root `tsconfig.json` with a depth-aware relative path.
- Adds `#packages/*` path mapping.
- Enables `composite` for internal packages.
- Converts internal project reference labels into relative tsconfig references.
- Excludes child Bazel subpackages via `native.subpackages()`.

### Generated Data Packages (`tools/generated.bzl`)

`generate_package_file()` runs TypeScript generation scripts and keeps the output
inside Bazel. It intentionally does not call `write_source_files`.

`formatjs_generated_package()` compiles generated `.ts` files with
`oxc_transpiler`, creates a minimal package.json, and packages the result under
`@formatjs_generated/<name>`.

Root `BUILD.bazel` calls `link_all_generated_packages()` from
`tools/generated_packages.bzl` so generated packages are available as
`//:node_modules/@formatjs_generated/<name>` labels.

See `knowledge-base/011-generated-packages.md` for the generated package layout.

### `oxc_transpiler`

`tools/oxc_transpiler.bzl` wraps `tools/oxc-transpiler/index.mjs`.

- Inputs: `.ts` / `.tsx` sources.
- Outputs: `.js` and `.d.ts`.
- Uses `onlyRemoveTypeImports: true` and declaration generation.
- Rewrites relative `.ts` imports to `.js` for runtime ESM compatibility.

## Composite Subpackages

Internal packages can be split across Bazel packages:

```
packages/ecma402-abstract/
  BUILD.bazel
  types/BUILD.bazel
  NumberFormat/BUILD.bazel
  DateTimeFormat/BUILD.bazel
  DisplayNames/BUILD.bazel
  DurationFormat/BUILD.bazel
  PluralRules/BUILD.bazel
  RelativeTimeFormat/BUILD.bazel
```

For internal packages, `formatjs_library()` generates composite IDE tsconfigs
and parent packages exclude child Bazel subpackages to avoid double compilation.
Consumers depend directly on the subpackage labels they import.

## `.bazelrc` Flags

### Project Flags

| Flag                                             | Value / config              | Rationale                       |
| ------------------------------------------------ | --------------------------- | ------------------------------- |
| `--enable_bzlmod`                                | enabled                     | Use `MODULE.bazel`              |
| `--enable_platform_specific_config`              | enabled                     | Host platform-specific config   |
| `java_language_version`                          | 17                          | ICU4J conformance tests         |
| `NODE_OPTIONS`                                   | `--max-old-space-size=4096` | Prevent Node OOMs during builds |
| `@aspect_rules_ts//ts:skipLibCheck`              | `honor_tsconfig`            | Respect per-target tsconfig     |
| `@aspect_rules_ts//ts:default_to_tsc_transpiler` | enabled                     | Default ts_project transpiler   |
| `--experimental_platform_in_output_dir`          | enabled                     | Platform-specific output layout |
| `--remote_cache_compression`                     | enabled                     | Smaller remote cache transfer   |

### Aspect `.bazelrc` Imports

The repo imports Aspect's Bazel 6 recommended rc files:

- `.aspect/bazelrc/bazel6.bazelrc`
- `.aspect/bazelrc/convenience.bazelrc`
- `.aspect/bazelrc/correctness.bazelrc`
- `.aspect/bazelrc/debug.bazelrc`
- `.aspect/bazelrc/performance.bazelrc`

## Build Flow Example

Building a published package such as `//packages/intl-locale:pkg`:

```
1. bzlmod resolves MODULE.bazel dependencies
2. npm_translate_lock exposes pnpm-lock.yaml packages as //:node_modules/* labels
3. Gazelle-maintained BUILD attrs provide srcs and deps
4. copy_to_bin(:srcs) materializes sources in Bazel output
5. ts_project(:typecheck) runs tsgo with no emit
6. rolldown_bundle() bundles JS and declarations for each entry point
7. validation tests inspect bundled output and package metadata
8. npm_package(:pkg) assembles the publishable package
9. root :dist aggregates all package :pkg targets
```

Generated-data imports add this path:

```
generate_package_file()
  → formatjs_generated_package()
  → link_all_generated_packages()
  → //:node_modules/@formatjs_generated/<name>
  → bundled inline by formatjs_library()
```

## Critical Rules

1. **Do not run `bazel clean` casually.** It destroys local cache state and can
   turn a small rebuild into a full rebuild.
2. **Use Bazel for builds/tests.** Root npm/pnpm scripts delegate to Bazel for
   build and test work.
3. **Run Gazelle after import graph changes.** Use `bazel run //:gazelle`.
4. **Rust benchmarks need `-c opt`.** Debug Rust benchmarks are not meaningful.
5. **Keep generated data in Bazel output.** New generated data should use
   `generate_package_file()` / `formatjs_generated_package()`, not checked-in
   generated `.ts` files.
