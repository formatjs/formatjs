# Migration Plan: `@formatjs_generated` Packages

> **Status: NOT STARTED.** Migrate 37 `.generated.ts` files from checked-in source to Bazel-only `@formatjs_generated/*` npm packages.

## Goal

Remove all generated TypeScript data files from git. Generated files should be Bazel build artifacts, packaged as `@formatjs_generated/*` npm packages and linked into `node_modules` via `npm_link_package()`. See `knowledge-base/011-generated-packages.md` for the target architecture.

## Motivation

- **No stale data in git.** Currently, CLDR version bumps require running `bazel run //:cldr-gen` to regenerate 37 files, then committing them. This is error-prone — files can drift out of sync with their source data.
- **Cleaner git history.** Generated data changes produce large, unreviable diffs on every CLDR update.
- **Build correctness.** Bazel always derives data from source, eliminating the "forgot to regenerate" class of bugs.
- **Follows established pattern.** Mirrors the `@pplx_generated` approach used in other monorepos for TypeSpec/Protobuf generated code.

## Current State

### `generate_src_file()` Pipeline (today)

```
Script → ts_run_binary → oxfmt → write_source_files → checked into git
```

- 37 `.generated.ts` files committed across 17 packages
- Consumed via `#packages/<pkg>/<name>.generated.js` imports
- Listed in `formatjs_library(srcs=[...])` and compiled with the source package
- `cldr-gen` multirun in root BUILD.bazel runs all generation targets to update source

### Files to Migrate

17 source packages, 37 generated files total. Full inventory in `knowledge-base/011-generated-packages.md`.

2 Rust generated files in `crates/icu_messageformat_parser/` are **out of scope** — they stay as `write_source_files`.

## Migration Phases

### Phase 0: Infrastructure

**Effort:** Medium | **Risk:** Low (no behavior change)

Create the new macro infrastructure. All existing `generate_src_file()` calls continue to work unchanged.

#### New files

1. **`tools/generated.bzl`** — Two macros:
   - `generate_package_file(name, src, tool, data, args)` — Same pipeline as `generate_src_file()` but without `write_source_files`. Output stays in Bazel sandbox.
   - `formatjs_generated_package(name, package_name, srcs)` — Assembles generated files into an npm package: generates `package.json`, compiles `.ts` → `.js` + `.d.ts` via `oxc_transpiler`, creates `npm_package`.

2. **`tools/generated_packages.bzl`** — Registry of all generated packages + `link_all_generated_packages()` helper.

#### Modified files

3. **`tools/compile.bzl`** — In `_formatjs_package()`, exclude `@formatjs_generated` from rolldown externals so generated data is bundled inline:
   ```starlark
   external_packages = [
       dep.split("node_modules/")[1]
       for dep in deps
       if "node_modules/" in dep and "@formatjs_generated" not in dep
   ]
   ```

4. **`tools/tsconfig.bzl`** — Add `@formatjs_generated/*` to `packages_tsconfig()` paths for IDE resolution.

5. **`tools/index.bzl`** — Add `@formatjs_generated/*` path mapping to `generate_ide_tsconfig_json()`.

6. **`tools/gazelle/ts/resolve.go`** — Add handling for `@formatjs_generated/` imports in `resolveImportsToDeps()`:
   ```go
   if strings.HasPrefix(importPath, "@formatjs_generated/") {
       parts := strings.SplitN(importPath, "/", 3)
       if len(parts) >= 2 {
           result.external = append(result.external, "//:node_modules/@formatjs_generated/"+parts[1])
       }
       continue
   }
   ```

7. **`tools/gazelle/ts/generate.go`** — Update `collectSrcs()` to exclude `.generated.ts` files from `srcs` lists (they no longer exist on disk).

8. **`BUILD.bazel` (root)** — Import and call `link_all_generated_packages()`.

#### Validation

```bash
bazel build //...   # Existing build still works
bazel test //...    # Existing tests still pass
```

### Phase 1: Pilot — `intl-displaynames`

**Effort:** Low | **Risk:** Low (single file, no nesting, minimal consumers)

Migrate the simplest package to validate end-to-end.

#### Changes

1. **`packages/intl-displaynames/BUILD.bazel`**:
   - Replace `generate_src_file(name = "supported-locales", ...)` with `generate_package_file()` + `formatjs_generated_package()`
   - Remove `supported-locales.generated.ts` from `formatjs_library(srcs=[...])`
   - Add `//:node_modules/@formatjs_generated/intl-displaynames` to `formatjs_library(deps=[...])`

2. **`packages/intl-displaynames/should-polyfill.ts`**:
   ```typescript
   // Before
   import {supportedLocales} from '#packages/intl-displaynames/supported-locales.generated.js'
   // After
   import {supportedLocales} from '@formatjs_generated/intl-displaynames/supported-locales.js'
   ```

3. **`tools/generated_packages.bzl`** — Add `intl-displaynames` entry.

4. **Delete** `packages/intl-displaynames/supported-locales.generated.ts` from git.

#### Validation

```bash
bazel build //packages/intl-displaynames:dist
bazel test //packages/intl-displaynames:unit_test
bazel run //:gazelle -- -mode diff   # Verify gazelle handles the new import
bazel test //...                      # Full suite
```

IDE check: Open `should-polyfill.ts`, verify `@formatjs_generated/intl-displaynames/supported-locales.js` resolves.

### Phase 2: Remaining Single-File Packages

**Effort:** Low | **Risk:** Low

Same pattern as Phase 1 for these 7 packages:

| Package | File | Import consumers |
|---|---|---|
| intl-listformat | supported-locales | should-polyfill.ts |
| intl-pluralrules | supported-locales | should-polyfill.ts |
| intl-relativetimeformat | supported-locales | should-polyfill.ts |
| intl-segmenter | cldr-segmentation-rules | segmenter.ts |
| icu-skeleton-parser | regex | parser.ts |
| eslint-plugin-formatjs | emoji-data | rules/no-emoji.ts |
| intl-localematcher | abstract/regions | abstract/BestAvailableLocale.ts |

Note: `intl-localematcher` has a nested path (`abstract/regions`). The npm package exports it at `@formatjs_generated/intl-localematcher/abstract/regions.js`.

### Phase 3: Multi-File Flat Packages

**Effort:** Medium | **Risk:** Medium (more files, more import sites)

Migrate packages with multiple generated files at the package root level:

| Package | Files | Notes |
|---|---|---|
| intl-locale | 6 files | Most generated files of any package |
| intl-supportedvaluesof | 6 files | Re-exports types from generated files |
| intl-numberformat | 3 files | Migrate before intl-durationformat |
| intl-getcanonicallocales | 2 files | |
| intl-durationformat | 2 files | Depends on intl-numberformat for numbering-systems |
| icu-messageformat-parser | 2 files | |
| utils | 3 files | |

**Order matters:** Migrate `intl-numberformat` before `intl-durationformat` since the latter may reference the former's generated data.

### Phase 4: Nested-Path Packages

**Effort:** Medium | **Risk:** Medium (subdirectory structure in npm packages)

Migrate packages with generated files in subdirectories:

| Package | Nested paths |
|---|---|
| intl-datetimeformat | `data/all-tz`, `data/links` (+ root `supported-locales`) |
| ecma402-abstract | `NumberFormat/digit-mapping` (+ root `regex`) |

The `formatjs_generated_package(srcs={...})` dict handles nested paths naturally:
```starlark
formatjs_generated_package(
    name = "generated_pkg",
    package_name = "intl-datetimeformat",
    srcs = {
        "supported-locales.ts": ":supported-locales_gen",
        "data/all-tz.ts": ":all-tz_gen",
        "data/links.ts": ":links_gen",
    },
)
```

### Phase 5: Cleanup

**Effort:** Low | **Risk:** Low

1. **Simplify `cldr-gen` multirun** in root `BUILD.bazel`. It no longer writes to source — convert to a `bazel build` alias or test target that verifies all generated packages build successfully.
2. **Remove `generated-files` multirun** if all its targets have been migrated.
3. **Verify** no `.generated.ts` files remain in `packages/`:
   ```bash
   find packages/ -name '*.generated.ts' | wc -l  # should be 0
   ```
4. **Update `CLAUDE.md`** to remove references to `bazel run //:cldr-gen` writing to source.
5. **Regenerate tsconfigs** to pick up new path mappings:
   ```bash
   bazel run //:gazelle
   ```

## Rollback Plan

Each phase is independently revertible:
- Restore the deleted `.generated.ts` file(s) from git history
- Revert BUILD.bazel changes (switch back to `generate_src_file()`)
- Revert import changes in source files
- Remove the package from `GENERATED_PACKAGES` registry

## Key Risks

| Risk | Mitigation |
|---|---|
| IDE resolution breaks | `@formatjs_generated/*` tsconfig path mappings point to `bazel-bin/`; packages must be built once |
| Rolldown bundles break | `@formatjs_generated` excluded from externals — data is inlined into bundles |
| Gazelle produces wrong deps | Custom resolver handles `@formatjs_generated/` prefix; validate with `gazelle -mode diff` |
| CI builds slower | Generated files compile trivially (pure data, zero deps); oxc_transpiler is fast |
| `generate_package_file` scripts fail | Scripts are identical to today's `generate_src_file` scripts — same args, same data deps |
