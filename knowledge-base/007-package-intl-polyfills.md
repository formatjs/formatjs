# Intl Polyfill Packages — Shared Architecture

All 12 polyfill packages share a common architecture. See individual docs (007a-007l) for per-polyfill CLDR data pipeline details.

## Polyfill Strategy

- Polyfills only activate when native support is missing or buggy
- Each package exports: `index` (main), `polyfill` (auto-install if needed), `polyfill-force` (always install), `should-polyfill` (detection only)
- Uses CLDR data for locale-specific formatting rules

## Tree-Shaking

- Locale data is separately importable: `import '@formatjs/intl-numberformat/locale-data/en'`
- Only imported locales are bundled — critical for mobile where bundle size matters
- All packages use ES modules with `"type": "module"`

## Build Output

Each polyfill uses `rolldown_bundle` with `dts = True` to produce bundled output:

- Each entry point (index, polyfill, polyfill-force, should-polyfill) produces a single `.js`, `.js.map`, and `.d.ts` file
- Declaration files are bundled into one `.d.ts` per entry point via `rolldown-plugin-dts` (not scattered `src/*.d.ts` trees)
- The `no_internal_imports_test` validates that neither `.js` nor `.d.ts` files contain leaked `#packages/` path aliases
- The `package_exports_test` validates that all files referenced in `package.json` exports exist and have corresponding `.d.ts` files

## Two Data Loading Patterns

### Dynamic per-locale (numberformat, datetimeformat, pluralrules, displaynames, listformat, relativetimeformat)

- Locale data in separate `locale-data/{locale}.js` files (tree-shakeable)
- Registration via `Intl.{API}.__addLocaleData()` static method
- Buffered via `globalThis.__FORMATJS_{API}_DATA__` if polyfill not yet loaded
- Two-stage build: `cldr-raw` (extraction) → `locale-data` (distribution)

### Static compilation (durationformat, segmenter, locale, getcanonicallocales, supportedvaluesof, collator)

- Data compiled directly into the main bundle or generated package as `.ts` files
- No per-locale dynamic loading needed
- Single-stage build via `generate_src_file` targets

## CLDR Data Generation Pipeline

Each polyfill has scripts in `scripts/` that extract data from CLDR npm packages:

1. **Extract**: Scripts read CLDR JSON (from `cldr-*-full` npm packages) and produce intermediate files
2. **Transform**: Raw data is optimized and formatted for runtime consumption
3. **Generate**: Output as `.generated.ts` (static) or `locale-data/{locale}.js` (dynamic)
4. **All orchestrated via Bazel** `generate_src_file` and `ts_run_binary` targets

## Conformance Audit

See the [2026-09-06 ECMA-402 draft audit](./013-ecma402-audit-2026-09-06.md) for confirmed gaps, reproductions, and follow-up checklists.

## Test Strategy

- **Vitest unit tests** — Core functionality
- **Test262 conformance** — tc39/test262 suite for standards compliance
- **Generated locale tests** — Per-locale snapshot tests for data correctness
- **ICU4J conformance** — Cross-reference with ICU4J 78.1 (Java reference implementation)

## Common Dependencies

All polyfills depend on `@formatjs/ecma402-abstract` and `@formatjs/intl-localematcher`. NumberFormat, DateTimeFormat, and PluralRules additionally depend on `@formatjs/bigdecimal`.

## Individual Polyfill Docs

- [007a — intl-numberformat](./007a-polyfill-intl-numberformat.md) — ECMA-402 §11
- [007b — intl-datetimeformat](./007b-polyfill-intl-datetimeformat.md) — ECMA-402 §12 (+ IANA timezone pipeline)
- [007c — intl-pluralrules](./007c-polyfill-intl-pluralrules.md) — ECMA-402 §16 (CLDR rule compiler)
- [007d — intl-displaynames](./007d-polyfill-intl-displaynames.md) — ECMA-402 §12
- [007e — intl-listformat](./007e-polyfill-intl-listformat.md) — ECMA-402 §13
- [007f — intl-relativetimeformat](./007f-polyfill-intl-relativetimeformat.md) — ECMA-402 §17
- [007g — intl-durationformat](./007g-polyfill-intl-durationformat.md) — Stage 3 Proposal
- [007h — intl-segmenter](./007h-polyfill-intl-segmenter.md) — ECMA-402 §18 (Unicode segmentation rules)
- [007i — intl-locale](./007i-polyfill-intl-locale.md) — ECMA-402 §14 (6 CLDR data sources)
- [007j — intl-getcanonicallocales](./007j-polyfill-intl-getcanonicallocales.md) — ECMA-402 §8.2.1
- [007k — intl-supportedvaluesof](./007k-polyfill-intl-supportedvaluesof.md) — ECMA-402 §8.3.2
- [007l — intl-collator](./007l-polyfill-intl-collator.md) — ECMA-402 §10 (CLDR collation compiler)

## Option objects

Shared option helpers accept callable objects without invoking them. Property
getters run normally and their errors propagate. `GetOptionsObject` rejects
`null` and other primitives, while omitted options create a fresh empty object.

## Test262 gates

`bazel test //packages/intl-<package>:test262` runs the selected upstream tests,
including tracked failures. Each package's `test262-baseline.json` records the
execution count and exact failing test/scenario diagnostics. Changed counts,
new failures, changed diagnostics, and unexpected passes fail CI. A green gate
means the baseline is unchanged, not full conformance.

`bazel test //packages/intl-<package>:test262-strict` requires zero failures.
Strict targets are manual; baseline gates run in normal CI. Reports include
separate pass/failure counts and write `results.json` plus a candidate baseline
to Bazel's undeclared test outputs. Candidate baselines require review; never
copy them over existing baselines merely to make CI green.

The suites use isolated IIFE preludes. ListFormat's prelude
loads generated locale data. `tools/test262/runner_test` exercises the real
harness with passing, failing, and empty suites. Baselines require review when the pinned upstream selection changes.

All twelve package suites now select every upstream test at revision
`419d3e0a2273ba01a3bfcbec423f2801425b8e93`; `test262.BUILD` has no file exclusions.
The prelude also installs polyfills in nested Test262 realms. Run
`:test262-native` for the corresponding native-only control. Both modes use
the same stable host settings; missing Temporal support remains visible. See
[the full baseline and runtime comparison](./014-test262-conformance.md).

Test262 execution uses rules_js generated harness rules. Strict/native modes
are direct harness tests; baseline mode captures a report and exit code through
the generated build rule, then validates them in a separate test. Realm
installation scripts are generated before harness execution.
