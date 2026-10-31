# @formatjs/intl-numberformat

**ECMA-402 Section 16** — `Intl.NumberFormat`

## Purpose

Full polyfill for `Intl.NumberFormat` supporting decimal, currency, percent, unit, and compact notation formatting across 657 locales.

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

CLDR common XML 49 supplies locale-specific symbols and patterns for all 78
numeric numbering systems. The resolver applies parent locales, root aliases,
and same-locale plural fallback; unconfirmed/provisional entries are excluded,
matching the CLDR JSON threshold. Identical systems share Latin data through
registration-time aliases without mutating the caller's data.
When a numbering system has no short compact currency patterns, generation uses
the locale's Latin patterns while retaining the selected digits and symbols.

`scripts/number-data/` is a Gazelle-managed Bazel package containing the LDML
resolver, numbering-system projection, shared plural helpers, and resolver tests.
Generator entrypoints in `scripts/` depend on this library. `number-data.ts`
handles LDML lookup; `numbering-system-data.ts` projects number patterns. Currency names and units still come from CLDR JSON. Northern Sami
(`se-FI`) compact 1000 uses its local `other` pattern before the parent's `one`
pattern, following LDML lateral inheritance.

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
  Output: cldr-raw/{locale}.json (657 files)
  Merges numbers + currencies + units into single JSON per locale

Stage 2: locale-data (ts_run_binary)
  Input: cldr-raw/*.json
  Output: locale-data/{locale}.js + locale-data/{locale}.d.ts (1314 files)
  Wraps in __addLocaleData() registration pattern

Stage 3: Metadata generation (generate_src_file)
  → src/currency-digits.generated.ts (170+ currency codes)
  → src/numbering-systems.generated.ts (99 systems)
  → supported-locales.generated.ts (657 locales)
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
- **657 locales**: Full CLDR coverage with tree-shakeable per-locale imports

## Numbering system validation

A well-formed but unsupported `numberingSystem` option falls back to the locale's
supported numbering system. Only malformed Unicode type identifiers throw `RangeError`.

## NaN sign display

`signDisplay: "exceptZero"` uses the unsigned pattern for NaN.
GetNumberFormatPattern classifies NaN as positive-zero (step 11.a), then selects
the zero pattern for exceptZero (step 18.a.i). `always` still emits a plus sign.
See [ECMA-402 §16.5.11](https://tc39.es/ecma402/#sec-getnumberformatpattern).

## Range endpoints

`formatRange` and `formatRangeToParts` reject missing or undefined endpoints with
`TypeError` before coercing either argument. NaN endpoints still throw `RangeError`.
See [ECMA-402 §16.3.4, step 3](https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formatrange)
and [§16.3.5, step 3](https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formatrangetoparts).

## Symbol arguments

Formatting methods reject Symbol primitives with `TypeError`, including Symbols
returned by object coercion. ToIntlMathematicalValue step 4.a propagates ToNumber
errors; only invalid numeric strings use the NaN fallback.

### Option validation

Unit identifiers are case-sensitive: `mile` is valid, `MILE` throws `RangeError`,
even when the selected style does not display units. Unsupported rounding
increments also throw `RangeError`.

`microsecond` and `nanosecond` are supported units, including in compound units
and the `Intl.supportedValuesOf("unit")` list.

`resolvedOptions()` returns properties in specification order, including
`roundingPriority` before `trailingZeroDisplay`.

Internal plural selection uses options with a null prototype, preventing inherited
option getters from affecting NumberFormat or its RelativeTimeFormat consumers.

`useGrouping: "auto"` respects CLDR minimum grouping digits. Polish four-digit
numbers remain ungrouped; `"always"` still requests grouping.

Range formatting preserves complete CLDR separators, including surrounding spaces.
Only matching affixes collapse; retained affixes have `source: "shared"`.
Different signs and scientific or compact notation remain separate.

Approximate ranges place the approximately sign in the locale's minus-sign position
for unsigned values, or before an existing plus/minus sign. Currency prefixes,
suffix signs, bidi literals, and unit wrappers use the same number pattern.

Matching sign prefixes can be shared alongside a shared currency or unit suffix.
Mixed signs remain attached to their endpoints.

## Rust and Hermes port

`crates/intl_numberformat` owns formatting, parts, ranges, option/locale resolution,
and per-locale number/plural records. Generated packs reuse TS CLDR extraction and
canonical plural-locale matching. Registration preserves existing records,
explicit aliases and parent fallbacks; invalid aliases reject atomically.
Rounding reuses PluralRules digit handling with currency/percent defaults.
Conformance compares every generated locale and all advertised numbering systems
with TS. The owned C ABI snapshots locale resolution before later option getters can
replace registered data. Reconfiguration uses that snapshot; handles survive
registry destruction. Primitive-text queries share PluralRules mathematical
parsing, including radix strings, exact BigInts and Number clamps. Status 4
preserves TypeError separately from RangeError. Hermes source/bytecode factories implement constructor/prototype semantics,
ordered getter/coercion paths, WeakMap brands, cached format functions and fresh
resolved options. Both modes compare over 7,600 cases against TS, including all digit
systems. Locale resolution stays fixed when later getters replace registry data.
SDK `:numberformat` packages the adapter, `38-IntlNumberFormat.js`, and on-demand
number/plural packs; an independent typed consumer embeds English/French only.

Tiny compact values never receive a suffix from a lexical comparison against an
exponent-formatted magnitude. Sparse translated currency-name maps fall back to
the currency code. Both fixes have TS/Rust coverage; tiny values also match native
Intl formatting and parts.

The standard decimal fast path retains its numeric part buffer and inserts any
sign before it. RelativeTimeFormat shares this path, avoiding a second vector
without changing sign order or nonfinite-number handling.

## Benchmarks

Run `bazel run //packages/intl-numberformat/benchmark:benchmark` for formatting
benchmarks, or `:profile` in the same package for repeated formatting. These
targets declare their generated ESM manifest and load `en.json` relative to the
entrypoint; root `#packages/*` imports do not cross the benchmark package boundary.

### Digit grouping

Grouping uses decimal digit counts and preserves supplementary-plane digits
such as Adlam as complete code points. BMP digits retain the string-slicing path.
Locale numbering-system availability remains a separate data concern.

The shared digit mapping is generated from pinned CLDR `numberingSystems.json`
numeric entries. It includes all 78 systems in the current ECMA-402 digit table;
Latin digits use the unchanged ASCII path. Algorithmic numbering systems are not
digit substitutions. Locale availability still comes from number locale data.

Scientific exponent digits use numbering-system substitution without mantissa
rounding increments. Native Intl regressions cover both BMP and supplementary
digit systems; Rust/TS parity includes scientific and engineering increments.

### Native compiled provider

The Hermes SDK now embeds build-selected locale records in Rust rather than
shipping locale JSON for application registration. Rust validates the existing
CLDR data and compiles plural rules at build time; calendar locale patches merge
into DateTimeFormat records. Per-registry lazy caches isolate mutable overrides.
The explicit-registration targets retain custom-provider and TS conformance use.
See [native data setup](../native/hermes/README.md#compiled-locale-data).

Native mathematical normalization returns canonical plain decimals up to 308
bytes directly. Such text cannot overflow or underflow Number; a single output
allocation replaces temporary digit strings and floating-point parsing. Validation
still rejects non-digits, leading integer zeros and trailing fraction zeros from
this path. General normalization handles exponents, radix literals and other
forms; BigInt retains its separate arbitrary-length handling.

Number grouping reads primary/secondary intervals with a reverse split iterator,
then emits integer chunks from the leading group forward. No pattern-group or
chunk vectors are needed. Minimum-grouping policy, digit mapping and symbols
still use the common formatting path. Keep primary/secondary boundaries and
exact parts intact when changing this traversal.

The borrowed number-piece visitor serves both owned parts and decimal text with
plural selection. Latin digits use immutable global identity mapping; locale
symbols are borrowed and other digit systems keep owned mapping. The plain
`#,##0.###` string path shares rendered rounding/category state with parts;
other decimal patterns retain the general fallback.

## Specification, ICU audit, and matching performance

[2026-10-31 audit](audits/2026-10-31-numberformat.md) records independent ICU4C/J
79.1 comparisons against CLDR 49, specification ambiguity probes, and benchmark
tradeoffs. Rust/TS parity and tracked Test262 baselines remain separate evidence.
The audit executable inventories differences; `--strict` exits nonzero for them.

NumberFormat passes its available-locale Set directly to ResolveLocale, retaining
stable matcher state while the matcher checks for registry mutations. Compact
thresholds use lazily compiled numeric magnitude/exponent indexes, shared across
numbering-system aliases. Re-register changed compact data through
`__addLocaleData` to invalidate those indexes. Serialized locale data stays
unchanged. Standard notation skips exponent-preview rounding because its exponent
is always zero.
