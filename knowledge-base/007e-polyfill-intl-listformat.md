# @formatjs/intl-listformat

**ECMA-402 Section 14** — `Intl.ListFormat`

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

## Iterable inputs

`format` and `formatToParts` accept iterables of strings, including a string's
individual code points. `undefined` produces an empty list. Non-iterables and
non-string elements throw `TypeError`; an invalid element also closes the iterator.

## Rust port

`crates/intl_listformat` compiles caller-loaded CLDR patterns and implements
CreatePartsFromList, DeconstructPattern and FormatList. UTF-16 units preserve
lone surrogates. Iterative pattern expansion avoids recursive stack growth and
quadratic copying. The shared Rust Locale matcher negotiates registered packs;
late registration leaves existing instances unchanged.

`//crates/intl_listformat:locale_data` wraps the existing TS extraction in
versioned per-locale JSON packs, including default-content aliases. The
differential suite compares every locale/type/style against the public TS
formatter. The Hermes facade handles observable option access and iteration;
owned C ABI handles retain data independently of the registry. Source and
optimized-bytecode conformance also checks brands, subclassing, IteratorClose,
captured intrinsics and fresh results. SDK consumers select independent JSON
packs and link the `:listformat` adapter against the shared Rust archive.

### Native compiled provider

The Hermes SDK now embeds build-selected locale records in Rust rather than
shipping locale JSON for application registration. Rust validates the existing
CLDR data and compiles plural rules at build time; calendar locale patches merge
into DateTimeFormat records. Per-registry lazy caches isolate mutable overrides.
The explicit-registration targets retain custom-provider and TS conformance use.
See [native data setup](../native/hermes/README.md#compiled-locale-data).

### Contextual joins and ICU conformance

Rust and TS select Spanish `e`/`u` and Hebrew hyphenated joins from the next
item, only for matching pair/end patterns. Hebrew uses Unicode Script rather
than block membership; empty strings and lone surrogates remain intact.

ICU4J 78.1 generates 2,871 cases spanning 11 locales and all types/styles.
ICU4C 78.1 checks every result, and the Chromium-locale Hermes test consumes
the same cases in source and bytecode modes. Eighteen exact C/J differences
are pinned in `conformance-tests/icu4j/list-format-icu-differences.tsv`; these
use ICU4C's script-aware behavior and Spanish `11 ` handling. Both oracle
outputs remain checked. See `conformance-tests/icu4c/README.md`.

An independent ICU4X ListFormatter also checks 2,772 scalar-string cases.
Its 66 exact differences are pinned separately; it cannot represent the 99
lone-surrogate cases, which remain covered by ICU4C/J and Hermes.

Hermes constructs parts as ordinary data-record literals. Private append
descriptors have null prototypes and are reused within each call, bypassing
inherited array setters and descriptor `get`/`set` properties without sharing
returned records.

When constructor options are omitted, Hermes still canonicalizes the full locale
list before a single Rust negotiation/construction call. No JS option getters
exist in that path. Explicit options retain the separate resolution step before
reading type/style, including inherited getters. The additive C ABI accepts
canonical locale-list JSON and returns an independently owned handle.

The private copy of iterable input drops its array prototype on the first valid
element. Direct index writes then bypass inherited setters without per-element
descriptors. Real iteration and validation still control IteratorClose. Empty
inputs avoid prototype mutation; public parts arrays and records stay ordinary.

Singleton lists emit their element directly. Forward patterns with an optional
separator stream borrowed UTF-16 slices without arena/task allocations, including
contextual Spanish/Hebrew joins. Reversed, prefixed or suffixed patterns retain
the general traversal. Empty separators add no literal record; empty input strings
still produce element records. String output reserves its input-length lower bound.
