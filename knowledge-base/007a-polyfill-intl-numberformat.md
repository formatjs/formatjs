# @formatjs/intl-numberformat

**ECMA-402 Section 11** — `Intl.NumberFormat`

## Purpose

Full polyfill for `Intl.NumberFormat` supporting decimal, currency, percent, unit, and compact notation formatting across 571 locales.

## Dependencies

- `@formatjs/ecma402-abstract` — Core ECMA-402 operations
- `@formatjs/intl-localematcher` — Locale matching
- `@formatjs/bigdecimal` — Arbitrary precision arithmetic (required by spec for correct rounding)

## CLDR Data Pipeline

### Sources

| CLDR Package        | Data Used                                                           |
| ------------------- | ------------------------------------------------------------------- |
| `cldr-numbers-full` | Number format patterns, symbols, compact notation, currency display |
| `cldr-units-full`   | Unit format patterns (long/short/narrow with plural variants)       |
| `cldr-core`         | Available locales, numbering systems, currency digit metadata       |

### Extraction Scripts (`scripts/`)

| Script                  | Input                           | Output                                                                              |
| ----------------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| `extract-numbers.ts`    | cldr-numbers-full               | Numbering systems, decimal/percent/currency patterns, symbols, compact notation     |
| `extract-currencies.ts` | cldr-numbers-full + cldr-core   | Currency display names (plural forms), symbols, narrow symbols                      |
| `extract-units.ts`      | cldr-units-full                 | Unit patterns per style (long/short/narrow) with plural variants, compound patterns |
| `currency-digits.ts`    | cldr-core currencyData.json     | Currency code → decimal digit count (e.g., USD→2, JPY→0)                            |
| `numbering-systems.ts`  | cldr-core numberingSystems.json | List of 99 numbering system names                                                   |

### Build Pipeline (BUILD.bazel)

```
Stage 1: cldr-raw (ts_run_binary)
  Input: extract-numbers.ts + extract-currencies.ts + extract-units.ts
  Output: cldr-raw/{locale}.json (571 files)
  Merges numbers + currencies + units into single JSON per locale

Stage 2: locale-data (ts_run_binary)
  Input: cldr-raw/*.json
  Output: locale-data/{locale}.js + locale-data/{locale}.d.ts (1142 files)
  Wraps in __addLocaleData() registration pattern

Stage 3: Metadata generation (generate_src_file)
  → src/currency-digits.generated.ts (170+ currency codes)
  → src/numbering-systems.generated.ts (99 systems)
  → supported-locales.generated.ts (571 locales)
```

### Locale Data Structure

```json
{
  "locale": "en",
  "data": {
    "currencies": {
      "USD": {"displayName": {"one": "US dollar", "other": "US dollars"}, "symbol": "$", "narrow": "$"}
    },
    "numbers": {
      "nu": ["latn"],
      "symbols": {"latn": {"decimal": ".", "group": ",", "percentSign": "%", ...}},
      "decimal": {"latn": {"standard": "#,##0.###", "long": {...}, "short": {...}}},
      "currency": {"latn": {"standard": "¤#,##0.##", "accounting": "¤#,##0.##;(¤#,##0.##)", ...}},
      "percent": {"latn": "#,##0%"}
    },
    "units": {
      "simple": {"length-meter": {"long": {"one": "{0} meter", "other": "{0} meters"}, ...}},
      "compound": {"per": {"long": "{0}/{1}", ...}}
    }
  }
}
```

### Runtime Loading

- `NumberFormat.__addLocaleData()` registers locale data
- Buffered via `globalThis.__FORMATJS_NUMBERFORMAT_DATA__` if polyfill not yet loaded
- `currencyDigitsData` and `numberingSystemNames` are statically imported at build time

## Key Design Decisions

- **BigDecimal for precision**: ECMA-402 requires correct rounding for all digit options; JavaScript's IEEE 754 doubles are insufficient
- **Plural rule integration**: Compact notation and unit patterns use plural categories from CLDR; collapses single-value plural rules if same as "other"
- **571 locales**: Full CLDR coverage with tree-shakeable per-locale imports
