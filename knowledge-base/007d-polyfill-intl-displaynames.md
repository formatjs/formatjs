# @formatjs/intl-displaynames

**ECMA-402 Section 12** — `Intl.DisplayNames`

## Purpose

Polyfill for `Intl.DisplayNames` — provides localized display names for languages, regions, scripts, currencies, calendars, and date/time fields across 643 locales.

## Dependencies

- `@formatjs/ecma402-abstract`, `@formatjs/intl-localematcher`

## CLDR Data Pipeline

### Sources

| CLDR Package            | Data Used                                                               |
| ----------------------- | ----------------------------------------------------------------------- |
| `cldr-localenames-full` | languages.json, territories.json, scripts.json, localeDisplayNames.json |
| `cldr-numbers-full`     | currencies.json (currency display names)                                |
| `cldr-dates-full`       | dateFields.json (date/time field names)                                 |
| `cldr-core`             | availableLocales.json                                                   |

### Extraction Script (`scripts/extract-displaynames.ts`)

Loads all CLDR locale data via dynamic imports and extracts:

- **Language names**: Display names for language codes with style variants (standard, long, short, narrow)
- **Region names**: Display names for territory/country codes
- **Script names**: Display names for script codes (Latn, Cyrl, etc.)
- **Currency names**: Currency display names with plural forms
- **Calendar names**: Calendar system display names
- **Date/time field names**: Field labels (year, month, day, etc.) with width variants

### Build Pipeline

```
Stage 1: cldr-raw (ts_run_binary)
  Output: cldr-raw/{locale}.json (643 files)

Stage 2: locale-data (ts_run_binary)
  Output: locale-data/{locale}.js + d.ts (1286 files)

Stage 3: supported-locales.generated.ts
```

### Runtime Loading

- Dynamic per-locale loading via `DisplayNames.__addLocaleData()`
- Buffered via `globalThis.__FORMATJS_DISPLAYNAMES_DATA__`
- Tree-shakeable: `import '@formatjs/intl-displaynames/locale-data/en'`

## Code validation and fallback

Calendar codes use hyphen-separated Unicode type identifiers; underscore forms
throw `RangeError`. When `fallback: 'code'` applies, `of` returns the canonical
code, such as `ZZZ` for an unknown currency supplied as `zzz`.

Language display-name codes accept Unicode language subtags of two, three, or
five to eight ASCII letters, with optional script, region, and variant subtags.

Calendar display-name data uses BCP 47 identifiers, including `gregory` and
`ethioaa`, rather than CLDR legacy keys.

## Rust port

`crates/intl_displaynames` validates and canonicalizes codes, looks up CLDR
names and composes localized language/region names. Versioned JSON packs reuse
the TS extraction and carry default-content aliases. Registry replacement is
atomic; existing instances retain their data. The differential suite compares
all locale/type/style/fallback combinations with TS using lookup negotiation.
The owned C ABI validates UTF-16 codes and separates invalid-code RangeError
from malformed ABI input. Handles own their data; successful result buffers
belong to the caller. The Hermes facade handles required options, observable coercion and private
receiver brands. Public native conformance compares source/optimized-bytecode
installers with TS, including sparse locales and tampered intrinsics. SDK
consumers link `:displaynames` and load selected per-locale JSON text. Independent
consumer smoke covers English/French loading and Afar's code/undefined fallback.

Code validation consumes the entire input, including trailing line terminators.

CLDR may omit language, territory or script name files for sparse locales. Those
categories use empty maps so code/undefined fallback still works. Other extraction
errors fail generation; they must not produce locale-only packs without data.

### Native compiled provider

The Hermes SDK now embeds build-selected locale records in Rust rather than
shipping locale JSON for application registration. Rust validates the existing
CLDR data and compiles plural rules at build time; calendar locale patches merge
into DateTimeFormat records. Per-registry lazy caches isolate mutable overrides.
The explicit-registration targets retain custom-provider and TS conformance use.
See [native data setup](../native/hermes/README.md#compiled-locale-data).
