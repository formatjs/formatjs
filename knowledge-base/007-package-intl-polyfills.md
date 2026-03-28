# Intl Polyfill Packages

All polyfill packages share a common architecture. This doc covers the shared patterns and per-polyfill specifics.

## Shared Architecture

### Polyfill Strategy

- Polyfills only activate when native support is missing or buggy
- Each package exports: `index` (main), `polyfill` (auto-install if needed), `polyfill-force` (always install), `should-polyfill` (detection only)
- Uses CLDR data for locale-specific formatting rules

### Tree-Shaking

- Locale data is separately importable: `import '@formatjs/intl-numberformat/locale-data/en'`
- Only imported locales are bundled — critical for mobile where bundle size matters
- All packages use ES modules with `"type": "module"`

### Data Generation

Each polyfill has scripts in `scripts/` that extract data from CLDR JSON packages (`cldr-numbers-full`, `cldr-dates-full`, etc.):

1. Raw extraction scripts produce `cldr-raw/` intermediate files
2. Compilation scripts transform raw data into optimized `locale-data/` files (788 locales)
3. All generated via Bazel `generate_src_file` targets

### Test Strategy

- **Vitest unit tests** — Core functionality
- **Test262 conformance** — tc39/test262 suite for standards compliance
- **Generated locale tests** — Per-locale snapshot tests for data correctness
- **ICU4J conformance** — Cross-reference with ICU4J 78.1 (Java reference implementation)

### Common Dependencies

All polyfills depend on `@formatjs/ecma402-abstract` and `@formatjs/intl-localematcher`.

---

## @formatjs/intl-numberformat

**ECMA-402 Section 11** — `Intl.NumberFormat`

- Full number formatting: decimal, currency, percent, unit, compact notation
- Uses `@formatjs/bigdecimal` for arbitrary precision arithmetic (required for correct rounding per spec)
- 788 locales supported with full CLDR number data
- Generated: `currency-digits.generated.ts` (ISO 4217), `numbering-systems.generated.ts` (35+ systems)
- Extra dep: `@formatjs/bigdecimal`

## @formatjs/intl-datetimeformat

**ECMA-402 Section 12** — `Intl.DateTimeFormat`

- Full date/time formatting with timezone and calendar support
- Integrates IANA timezone database via `tz_data.tar.gz`
- Supports multiple calendar systems (gregorian, islamic, buddhist, etc.)
- Most complex polyfill — largest BUILD.bazel (950+ lines)
- Uses `@formatjs/bigdecimal` for date calculations
- Extra dep: `@formatjs/bigdecimal`

## @formatjs/intl-pluralrules

**ECMA-402 Section 16** — `Intl.PluralRules`

- Evaluates CLDR plural rules: zero, one, two, few, many, other
- 293+ locales with rule data
- Uses `@formatjs/bigdecimal` for precise operand calculation
- Extra dep: `@formatjs/bigdecimal`

## @formatjs/intl-displaynames

**ECMA-402 Section 12** — `Intl.DisplayNames`

- Localized display names for languages, regions, scripts, currencies, calendars, date/time fields
- CLDR-backed display name database

## @formatjs/intl-listformat

**ECMA-402 Section 13** — `Intl.ListFormat`

- Locale-aware list formatting with conjunction, disjunction, and unit styles
- CLDR list patterns for separator and conjunction rules

## @formatjs/intl-relativetimeformat

**ECMA-402 Section 17** — `Intl.RelativeTimeFormat`

- Formats relative time expressions (e.g., "2 days ago", "in 3 hours")
- Supports numeric and auto styles

## @formatjs/intl-durationformat

**ECMA-402 Stage 3 Proposal** — `Intl.DurationFormat`

- Formats durations (hours, minutes, seconds)
- Generated: `time-separators.generated.ts` (3900+ lines), `numbering-systems.generated.ts`

## @formatjs/intl-segmenter

**ECMA-402 Section 18** — `Intl.Segmenter`

- Text segmentation: grapheme, word, sentence boundaries
- Uses CLDR segmentation rules (generated via `generate-cldr-segmentation-rules.ts`)
- Processes Unicode break property data files (GraphemeBreakProperty, WordBreakProperty, SentenceBreakProperty)

## @formatjs/intl-locale

**ECMA-402 Section 14** — `Intl.Locale`

- Locale information and manipulation API
- Generated: calendars, character-orders, hour-cycles, numbering-systems, timezones, week-data
- Dependencies: ecma402-abstract, intl-getcanonicallocales, intl-supportedvaluesof

## @formatjs/intl-getcanonicallocales

**ECMA-402 Section 8.2.1** — `Intl.getCanonicalLocales`

- Canonicalizes locale identifier strings
- Generated: CLDR likely subtags + language aliases (7700+ lines)
- No internal dependencies (leaf package)

## @formatjs/intl-supportedvaluesof

**ECMA-402 Section 8.3.2** — `Intl.supportedValuesOf`

- Returns supported values for: calendar, collation, currency, numberingSystem, timeZone, unit
- Generated: one file per value type from CLDR
