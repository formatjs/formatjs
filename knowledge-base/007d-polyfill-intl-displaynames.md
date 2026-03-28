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
