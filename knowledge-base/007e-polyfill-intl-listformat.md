# @formatjs/intl-listformat

**ECMA-402 Section 13** — `Intl.ListFormat`

## Purpose

Polyfill for `Intl.ListFormat` — formats lists with locale-specific conjunctions, disjunctions, and unit separators across 700+ locales.

## Dependencies

- `@formatjs/ecma402-abstract`, `@formatjs/intl-localematcher`

## CLDR Data Pipeline

### Sources

| CLDR Package     | Data Used                    |
| ---------------- | ---------------------------- |
| `cldr-misc-full` | listPatterns.json per locale |
| `cldr-core`      | availableLocales.json        |

### Extraction Script (`scripts/extract-list.ts`)

Loads `listPatterns.json` for each locale and extracts:

- **Conjunction patterns** (long/short/narrow): "A, B, and C"
- **Disjunction patterns** (long/short/narrow): "A, B, or C"
- **Unit patterns** (long/short/narrow): "A, B, C"

Each pattern has: `start`, `middle`, `end`, and `pair` templates.

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
  "conjunction": {
    "long": {"start": "{0}, {1}", "middle": "{0}, {1}", "end": "{0}, and {1}", "pair": "{0} and {1}"},
    "short": {...},
    "narrow": {...}
  },
  "disjunction": {"long": {...}, "short": {...}, "narrow": {...}},
  "unit": {"long": {...}, "short": {...}, "narrow": {...}}
}
```

### Runtime Loading

- Dynamic per-locale via `ListFormat.__addLocaleData()`
- Buffered via `globalThis.__FORMATJS_LISTFORMAT_DATA__`
