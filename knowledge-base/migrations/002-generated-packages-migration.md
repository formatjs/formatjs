# Migration Plan: `@formatjs_generated` Packages

> **Status: NOT STARTED.** Migrate 37 `.generated.ts` files from checked-in source to Bazel-only `@formatjs_generated/*` npm packages grouped by data source.

## Goal

Remove all generated TypeScript data files from git. Generated files become Bazel build artifacts, organized into 3 composite TypeScript projects by data source (`cldr`, `tz`, `unicode`), linked into `node_modules` via `npm_link_package()`. See `knowledge-base/011-generated-packages.md` for the target architecture.

## Motivation

- **No stale data in git.** CLDR version bumps currently require `bazel run //:cldr-gen` + commit. Files can drift out of sync.
- **Cleaner git history.** No large unreviable diffs on data updates.
- **Build correctness.** Bazel always derives data from source.
- **Data-source organization.** Files grouped by where they come from (CLDR, IANA tz, Unicode), not scattered across consuming packages.

## Current State

37 `.generated.ts` files committed across 17 packages, generated via `generate_src_file()` → `write_source_files`. Consumed via `#packages/<pkg>/<name>.generated.js` imports.

2 Rust generated files in `crates/icu_messageformat_parser/` are **out of scope**.

## Target Packages

| Package | Data Source | File Count |
|---|---|---|
| `@formatjs_generated/cldr` | CLDR npm packages, ISO 4217 | 28 |
| `@formatjs_generated/tz` | IANA Time Zone Database | 2 |
| `@formatjs_generated/unicode` | Unicode character data, emoji-data.txt, CLDR segmentation | 7 |

Full file listing in `knowledge-base/011-generated-packages.md`.

## Migration Phases

### Phase 0: Infrastructure

**Effort:** Medium | **Risk:** Low (no behavior change)

#### New files

1. **`tools/generated.bzl`** — `generate_package_file()` and `formatjs_generated_package()` macros.

2. **`tools/generated_packages.bzl`** — Registry + `link_all_generated_packages()`.

3. **`packages/generated/cldr/BUILD.bazel`** — CLDR generated package (initially empty, populated in later phases).

4. **`packages/generated/tz/BUILD.bazel`** — Timezone generated package.

5. **`packages/generated/unicode/BUILD.bazel`** — Unicode generated package.

#### Modified files

6. **`tools/compile.bzl`** — Exclude `@formatjs_generated` from rolldown externals:
   ```starlark
   external_packages = [
       dep.split("node_modules/")[1]
       for dep in deps
       if "node_modules/" in dep and "@formatjs_generated" not in dep
   ]
   ```

7. **`tools/tsconfig.bzl`** — Add `@formatjs_generated/*` to `packages_tsconfig()` paths.

8. **`tools/index.bzl`** — Add `@formatjs_generated/*` path mapping to `generate_ide_tsconfig_json()`.

9. **`tools/gazelle/ts/resolve.go`** — Handle `@formatjs_generated/` imports:
   ```go
   if strings.HasPrefix(importPath, "@formatjs_generated/") {
       parts := strings.SplitN(importPath, "/", 3)
       if len(parts) >= 2 {
           result.external = append(result.external,
               "//:node_modules/@formatjs_generated/"+parts[1])
       }
       continue
   }
   ```

10. **`BUILD.bazel` (root)** — Import and call `link_all_generated_packages()`.

#### Validation

```bash
bazel build //...   # Existing build still works
bazel test //...    # Existing tests still pass
```

### Phase 1: Pilot — `@formatjs_generated/tz`

**Effort:** Low | **Risk:** Low (2 files, single consumer)

The simplest package: only 2 generated files, both consumed by `intl-datetimeformat`.

#### Changes

1. **`packages/generated/tz/BUILD.bazel`** — Add `generate_package_file()` targets for `all-tz` and `links`, plus `formatjs_generated_package()`.

2. **`packages/intl-datetimeformat/BUILD.bazel`**:
   - Remove `generate_src_file` calls for `all-tz` and `links`
   - Remove `data/all-tz.generated.ts` and `data/links.generated.ts` from `formatjs_library(srcs=[...])`
   - Add `//:node_modules/@formatjs_generated/tz` to `deps`

3. **`packages/intl-datetimeformat/core.ts`** (and any other consumers):
   ```typescript
   // Before
   import links from '#packages/intl-datetimeformat/data/links.generated.js'
   // After
   import links from '@formatjs_generated/tz/links.js'
   ```

4. **Delete** `packages/intl-datetimeformat/data/all-tz.generated.ts` and `data/links.generated.ts` from git.

#### Validation

```bash
bazel build //packages/intl-datetimeformat:dist
bazel test //packages/intl-datetimeformat:unit_test
bazel run //:gazelle -- -mode diff
bazel test //...
```

### Phase 2: `@formatjs_generated/unicode`

**Effort:** Medium | **Risk:** Low (7 files, independent consumers)

Migrate all Unicode-derived files across 5 source packages.

| File | Origin Package | Consumer(s) |
|---|---|---|
| `ecma402-abstract/regex.ts` | ecma402-abstract | ecma402-abstract, icu-messageformat-parser |
| `ecma402-abstract/digit-mapping.ts` | ecma402-abstract/NumberFormat | ecma402-abstract/NumberFormat |
| `icu-messageformat-parser/regex.ts` | icu-messageformat-parser | icu-messageformat-parser |
| `icu-skeleton-parser/regex.ts` | icu-skeleton-parser | icu-skeleton-parser |
| `eslint-plugin-formatjs/emoji-data.ts` | eslint-plugin-formatjs | eslint-plugin-formatjs |
| `intl-segmenter/cldr-segmentation-rules.ts` | intl-segmenter | intl-segmenter |

For each: move `generate_src_file` → `generate_package_file` in `packages/generated/unicode/BUILD.bazel`, update imports, remove from source `srcs`, add dep on `//:node_modules/@formatjs_generated/unicode`.

### Phase 3: `@formatjs_generated/cldr`

**Effort:** High | **Risk:** Medium (28 files, many consumers)

The largest package. Migrate in sub-batches by origin package:

**Batch 3a:** `intl-getcanonicallocales` (2 files: aliases, likelySubtags)

**Batch 3b:** `utils` (3 files: currencyMinorUnits, defaultCurrencyData, defaultLocaleData)

**Batch 3c:** `intl-numberformat` (3 files: currency-digits, numbering-systems, supported-locales)
- **Important:** Migrate this before `intl-durationformat` and `intl-supportedvaluesof` since they copy `numbering-systems` from here.

**Batch 3d:** `intl-durationformat` (2 files) + `intl-supportedvaluesof` (6 files)
- Update the numbering-systems copy to import from `@formatjs_generated/cldr/intl-numberformat/numbering-systems.js`

**Batch 3e:** `intl-locale` (6 files) + `intl-localematcher` (1 file: regions)

**Batch 3f:** Remaining supported-locales files (intl-displaynames, intl-listformat, intl-pluralrules, intl-relativetimeformat, intl-datetimeformat)

**Batch 3g:** `icu-messageformat-parser/time-data` (1 file)

### Phase 4: Cleanup

**Effort:** Low | **Risk:** Low

1. Simplify `cldr-gen` multirun — convert to a `bazel build` alias or validation test.
2. Remove `generated-files` multirun entries that are now obsolete.
3. Verify no `.generated.ts` files remain:
   ```bash
   find packages/ -name '*.generated.ts' | wc -l  # should be 0
   ```
4. Update `CLAUDE.md` to reference new `@formatjs_generated` pattern.
5. Regenerate tsconfigs: `bazel run //:gazelle`.

## Import Change Summary

```typescript
// CLDR data — before
import {timezones} from '#packages/intl-locale/timezones.generated.js'
import {supportedLocales} from '#packages/intl-pluralrules/supported-locales.generated.js'
// CLDR data — after
import {timezones} from '@formatjs_generated/cldr/intl-locale/timezones.js'
import {supportedLocales} from '@formatjs_generated/cldr/intl-pluralrules/supported-locales.js'

// Timezone data — before
import links from '#packages/intl-datetimeformat/data/links.generated.js'
// Timezone data — after
import links from '@formatjs_generated/tz/links.js'

// Unicode/regex data — before
import {S_UNICODE_REGEX} from '#packages/ecma402-abstract/regex.generated.js'
// Unicode/regex data — after
import {S_UNICODE_REGEX} from '@formatjs_generated/unicode/ecma402-abstract/regex.js'
```

## Rollback Plan

Each phase is independently revertible:
- Restore deleted `.generated.ts` files from git history
- Revert BUILD.bazel changes (switch back to `generate_src_file()`)
- Revert import changes in source files
- Remove entries from `GENERATED_PACKAGES` registry

## Key Risks

| Risk | Mitigation |
|---|---|
| IDE resolution breaks | tsconfig path mappings to `bazel-bin/`; build packages once |
| Rolldown bundles break | `@formatjs_generated` excluded from externals — data inlined |
| Gazelle wrong deps | Custom resolver for `@formatjs_generated/`; validate with `gazelle -mode diff` |
| Generation scripts break when moved | Scripts stay in their original `packages/*/scripts/` location; only the Bazel target moves |
