# @formatjs/intl-relativetimeformat

**ECMA-402 Section 18** — `Intl.RelativeTimeFormat`

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
| `cldr-core`         | availableLocales.json, numeric numbering systems   |

### Extraction Script (`scripts/extract-relative.ts`)

Extracts date field patterns for 8 time units with style variants:

- **Fields**: year, quarter, month, week, day, hour, minute, second
- **Styles**: long (default), short, narrow
- **Pattern types**: relative (-1, 0, +1 named forms) + relativeTime (future/past with plural variants)
- **Numbering system**: Keeps the locale default first, followed by every other CLDR numeric system. NumberFormat handles digit and separator formatting.

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

Internal number and plural formatters use the resolved locale. Internal number
options have no prototype, so unrelated inherited options cannot affect them.

## Rust and Hermes port

`crates/intl_relativetimeformat` loads versioned, self-contained JSON packs with
relative fields plus selected Rust number/plural packs. The generator canonicalizes
locale indexes before matching, preserving aliases such as `sh` / `sr-Latn`.
Registry matching sees only loaded relative locales; internal formatters retain
their owned data independently of global JS formatter registrations.

Locale/nu resolution precedes style/numeric reads. Fields are fetched afterward,
matching the TS initialization order when a getter replaces locale data. Existing
instances keep their prior records. Each immutable pack also keeps a bounded
cache of internal NumberFormat records, keyed by resolved locale and numbering
system. Style/numeric validation still runs before reuse; new data gets a fresh
cache. Formatting reads its shared number record without locking. Numeric text is already a JS Number: the host
owns observable ToNumber/ToString ordering, BigInt/Symbol rejection and brands.
Rust preserves negative zero, named auto forms, style fallback, sparse plural
fallback and unit annotations on number parts. The owned ABI uses separate resolution/final creation calls and serializes
parts directly to preserve type/value/unit order. Unit UTF-16 keeps invalid
surrogates on the RangeError path. The SDK archive exports this ABI, C++ JSI adapters, source/precompiled factories,
selected locale packs and a typed independent-consumer smoke test.

Hermes links `//native/hermes:relativetimeformat`; SDK consumers link
`:relativetimeformat`. Install after canonicalization and register JSON strings
with `__addLocaleData`. No global JS number/plural constructor is required.
`39-IntlRelativeTimeFormat.js` supplies the precompiled installer factory.
Source/bytecode conformance covers all units/styles/numeric modes, all digit
systems, coercion order, brands, property order and registration during getters.
The TS class constructor relies on class semantics to require `new`; it must not
read an instance's `constructor` property during subclass construction.

### Native compiled provider

The Hermes SDK now embeds build-selected locale records in Rust rather than
shipping locale JSON for application registration. Rust validates the existing
CLDR data and compiles plural rules at build time; calendar locale patches merge
into DateTimeFormat records. Per-registry lazy caches isolate mutable overrides.
The explicit-registration targets retain custom-provider and TS conformance use.
See [native data setup](../native/hermes/README.md#compiled-locale-data).
