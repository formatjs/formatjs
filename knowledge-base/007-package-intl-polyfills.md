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

All 19 CLDR npm dependencies are pinned to 49.0.0 and grouped in Renovate.
Calendar packages require matching dates, numbers, and core peer versions.
After an upgrade, run each dynamic package's `:locales` Bazel target to refresh
`locales.generated.bzl` before building locale data. CLDR 49 supplies 657 full
locales (five added, 114 removed from 48.2); plural rules cover 225 locales.

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

- [007a — intl-numberformat](./007a-polyfill-intl-numberformat.md) — ECMA-402 §16
- [007b — intl-datetimeformat](./007b-polyfill-intl-datetimeformat.md) — ECMA-402 §11 (+ IANA timezone pipeline)
- [007c — intl-pluralrules](./007c-polyfill-intl-pluralrules.md) — ECMA-402 §17 (CLDR rule compiler)
- [007d — intl-displaynames](./007d-polyfill-intl-displaynames.md) — ECMA-402 §12
- [007e — intl-listformat](./007e-polyfill-intl-listformat.md) — ECMA-402 §14
- [007f — intl-relativetimeformat](./007f-polyfill-intl-relativetimeformat.md) — ECMA-402 §18
- [007g — intl-durationformat](./007g-polyfill-intl-durationformat.md) — ECMA-402 §13
- [007h — intl-segmenter](./007h-polyfill-intl-segmenter.md) — ECMA-402 §19 (Unicode segmentation rules)
- [007i — intl-locale](./007i-polyfill-intl-locale.md) — ECMA-402 §15 (6 CLDR data sources)
- [007j — intl-getcanonicallocales](./007j-polyfill-intl-getcanonicallocales.md) — ECMA-402 §8.3.1
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
the same pinned Node 26.8.1 host; fixtures verify Temporal in nested realms. See
[the full baseline and runtime comparison](./014-test262-conformance.md) and
[the remaining gaps and performance report](./015-test262-progress-2026-09-09.md).

Test262 execution uses rules_js generated harness rules. Strict/native modes
are direct harness tests; baseline mode invokes the generated harness binary
and separate validator within one test. Reports are test outputs, so disabling
test caching reruns the harness. Realm installation scripts are generated inputs.

## Root locale data

Dynamic locale registration preserves `und` data under its own locale. Likely
subtags can minimize `und` to `en`, but that does not make root formatting
patterns English data. Explicit language aliases continue to be minimized.

### Locale registration

Dynamic polyfills register loaded data under its original locale and CLDR
default-content children. Missing less-specific fallback tags are filled without
overwriting explicitly loaded data. Likely-subtag minimization does not merge
distinct locale records, so loading `ar-EG` cannot replace `ar`.
The default locale remains the first loaded locale's actual tag, rather than a
minimized tag that later data loading could overwrite.

## Native compiled data

Hermes SDK builds select locale records in Rust, independently of the TS packages'
dynamic registration API. See [native data setup](../native/hermes/README.md#compiled-locale-data).
Rust tools validate existing CLDR inputs, compile plural expressions, merge calendar
locale patches, and embed binary records in each native archive. No application JS
or C++ locale registration is required. Additional locales require a native rebuild.
Calendar arithmetic/table providers and timezone transitions remain optional resources.
The Hermes SDK also packages contrib extension sources in `contrib/`: Hermes
embeds the JavaScript fragments and calls one C++ installer linked to the same
Rust archive. `native/hermes/package/contrib/README.md` lists the integration edits.

Hermes SDK packaging and release flow: [007m](007m-hermes-distribution.md).

## Benchmark refresh

`bazel run -c opt //benchmarks/polyfills:benchmark` measures all 12 JS polyfills
plus LocaleMatcher using shipped bundles. Repeat with `--polyfill-dependencies`
to install all FormatJS Intl APIs before timing. Native built-ins are captured
before installation and remain available as controls.

See [methodology and current results](../benchmarks/polyfills/README.md). Keep
host/full dependency modes, construction, batched operations, and cold startup
separate. Construction rows include `resolvedOptions()`; other formatter rows
reuse instances. English data and timezone registration happen before timing.
The six dynamic packages expose narrow benchmark-only locale-data filegroups.

When refreshing results, record source revision and runtime/CPU metadata, retain
raw median/min/max results, and update each polyfill's Measured performance table.
Historical before/after audit artifacts retain their original revision labels.

### Rust benchmark coverage

`bazel run -c opt //benchmarks/polyfills:rust_benchmark` covers all 12 Rust
polyfills plus LocaleMatcher. English packs register before timing; supported-value
enumeration calls real Rust formatter probes. Results keep all seven samples.
Public pages distinguish TS, TS with polyfilled helpers, native JS, and Rust core.
Rust rows exclude Hermes/JSI and JS boundary work; compare workload definitions,
not raw cross-language ratios. The Rust matcher prepares the same 657-locale set
once; TS retains supported-array validation on each call.

The benchmark package's generated IDE config must be checked in. Validate actual
`:typecheck_typecheck_test`, `:polyfills-esm_typecheck_test`, and `:tsconfig_json_test`
targets; building the no-emit `:typecheck` target alone does not run those checks.
