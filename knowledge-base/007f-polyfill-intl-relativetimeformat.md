# @formatjs/intl-relativetimeformat

**ECMA-402 Section 17** — `Intl.RelativeTimeFormat`

## Purpose

Polyfill for `Intl.RelativeTimeFormat` — formats relative time expressions (e.g., "2 days ago", "in 3 hours") across 700+ locales.

## Dependencies

- `@formatjs/ecma402-abstract`, `@formatjs/intl-localematcher`

## CLDR Data Pipeline

### Sources

| CLDR Package        | Data Used                                          |
| ------------------- | -------------------------------------------------- |
| `cldr-dates-full`   | dateFields.json (relative time patterns per field) |
| `cldr-numbers-full` | numbers.json (default numbering system per locale) |
| `cldr-core`         | availableLocales.json                              |

### Extraction Script (`scripts/extract-relative.ts`)

Extracts date field patterns for 8 time units with style variants:

- **Fields**: year, quarter, month, week, day, hour, minute, second
- **Styles**: long (default), short, narrow
- **Pattern types**: relative (-1, 0, +1 named forms) + relativeTime (future/past with plural variants)
- **Numbering system**: Resolves default numbering system per locale

### Build Pipeline

```
Stage 1: cldr-raw (ts_run_binary)
  Output: cldr-raw/{locale}.json (700+ files)

Stage 2: locale-data (ts_run_binary)
  Output: locale-data/{locale}.js + d.ts (1400+ files)

Stage 3: supported-locales.generated.ts
```

### Locale Data Structure

```json
{
  "nu": ["latn"],
  "year": {
    "long": {
      "relative": {"-1": "last year", "0": "this year", "1": "next year"},
      "relativeTime": {
        "future": {"one": "in {0} year", "other": "in {0} years"},
        "past": {"one": "{0} year ago", "other": "{0} years ago"}
      }
    },
    "short": {...},
    "narrow": {...}
  },
  "month": {...},
  "day": {...},
  ...
}
```

### Runtime Loading

- Dynamic per-locale via `RelativeTimeFormat.__addLocaleData()`
- Buffered via global
