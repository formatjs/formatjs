# Intl Polyfill Packages — Shared Architecture

All 11 polyfill packages share a common architecture. See individual docs (007a-007k) for per-polyfill CLDR data pipeline details.

## Polyfill Strategy

- Polyfills only activate when native support is missing or buggy
- Each package exports: `index` (main), `polyfill` (auto-install if needed), `polyfill-force` (always install), `should-polyfill` (detection only)
- Uses CLDR data for locale-specific formatting rules

## Tree-Shaking

- Locale data is separately importable: `import '@formatjs/intl-numberformat/locale-data/en'`
- Only imported locales are bundled — critical for mobile where bundle size matters
- All packages use ES modules with `"type": "module"`

## Two Data Loading Patterns

### Dynamic per-locale (numberformat, datetimeformat, pluralrules, displaynames, listformat, relativetimeformat)

- Locale data in separate `locale-data/{locale}.js` files (tree-shakeable)
- Registration via `Intl.{API}.__addLocaleData()` static method
- Buffered via `globalThis.__FORMATJS_{API}_DATA__` if polyfill not yet loaded
- Two-stage build: `cldr-raw` (extraction) → `locale-data` (distribution)

### Static compilation (durationformat, segmenter, locale, getcanonicallocales, supportedvaluesof)

- Data compiled directly into the main bundle as `.generated.ts` files
- No per-locale dynamic loading needed
- Single-stage build via `generate_src_file` targets

## CLDR Data Generation Pipeline

Each polyfill has scripts in `scripts/` that extract data from CLDR npm packages:

1. **Extract**: Scripts read CLDR JSON (from `cldr-*-full` npm packages) and produce intermediate files
2. **Transform**: Raw data is optimized and formatted for runtime consumption
3. **Generate**: Output as `.generated.ts` (static) or `locale-data/{locale}.js` (dynamic)
4. **All orchestrated via Bazel** `generate_src_file` and `ts_run_binary` targets

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
