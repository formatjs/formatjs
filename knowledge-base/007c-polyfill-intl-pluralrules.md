# @formatjs/intl-pluralrules

**ECMA-402 Section 17** — `Intl.PluralRules`

## Purpose

Polyfill for `Intl.PluralRules` — evaluates CLDR plural rules to select plural categories (zero, one, two, few, many, other) for 227 locales. Also supports ordinal rules and plural ranges (LDML-43).

## Dependencies

- `@formatjs/ecma402-abstract`, `@formatjs/intl-localematcher`, `@formatjs/bigdecimal`

## CLDR Data Pipeline

### Sources

| CLDR File                                  | Data Used                                              |
| ------------------------------------------ | ------------------------------------------------------ |
| `cldr-core/supplemental/plurals.json`      | Cardinal plural rules per locale                       |
| `cldr-core/supplemental/ordinals.json`     | Ordinal plural rules per locale                        |
| `cldr-core/supplemental/pluralRanges.json` | Plural range mappings (start_end → category)           |
| `cldr-numbers-full/main/*/numbers.json`    | Compact exponent tables for locales using c/e operands |

### Compilation: PluralRulesCompiler (`scripts/plural-rules-compiler.ts`)

This is the most interesting part — CLDR textual rules are compiled to JavaScript functions at build time.

**CLDR rule syntax:**

```
pluralRule-count-one: i = 1 and v = 0
pluralRule-count-other:
```

**Compiled output:**

```javascript
function(num, isOrdinal, exponent = 0) {
  const i = Math.floor(Math.abs(parseFloat(integerPart)));
  const v = decimalPart.length;
  if (!isOrdinal) {
    if (i === 1 && v === 0) return "one";
  }
  return "other";
}
```

**Compiler optimizations:**

- **Operand detection**: Only generates code for operands actually used in rules (n, i, v, w, f, t, c, e)
- **AST-based codegen**: Uses TypeScript compiler API to build AST, then prints to JavaScript
- **Condition translation**: `i % 10 = 3..4,9` → `((i % 10) >= 3 && (i % 10) <= 4) || (i % 10) === 9`
- **Zero runtime rule parsing**: All rules pre-compiled to minimal if-else chains

**CLDR operands (UTS #35):**

- `n` = absolute value of source number
- `i` = integer digits of n
- `v` = visible fraction digits (with trailing zeros)
- `w` = visible fraction digits (without trailing zeros)
- `f` = visible fractional digits (with trailing zeros)
- `t` = visible fractional digits (without trailing zeros)
- `c`/`e` = compact decimal exponent

### Build Pipeline

```
Stage 1: cldr-raw (cldr-raw.ts + PluralRulesCompiler)
  Input: plurals.json + ordinals.json + pluralRanges.json + compact number patterns
  Process: Compile CLDR rules → JS functions via eval()
  Output: cldr-raw/{locale}.js (227 files with serialized function objects)

Stage 2: locale-data (cldr.ts)
  Input: cldr-raw/*.js
  Output: locale-data/{locale}.js + d.ts (227 per format)
  Wraps in __addLocaleData() pattern

Stage 3: supported-locales.generated.ts (227 locales)
```

### Locale Data Structure

```javascript
{
  "locale": "en",
  "data": {
    "categories": {
      "cardinal": ["one", "other"],
      "ordinal": ["few", "one", "other", "two"]
    },
    "fn": function(num, isOrdinal, exponent) { /* compiled rule */ },
    "pluralRanges": {
      "cardinal": {"one_other": "other", ...},
      "ordinal": {}
    }
  }
}
```

### Runtime: Operand Extraction (`abstract/GetOperands.ts`)

When `select(value)` is called:

1. Convert number to string via `ToIntlMathematicalValue()` (BigInt-safe)
2. Round and format with the configured digit options
3. Pass the formatted decimal string directly to `localeData.fn(decimalString, isOrdinal, compactExponent)` so leading and trailing fraction zeros survive
4. Return plural category string

### Runtime: Range Selection (`abstract/ResolvePluralRange.ts`)

When `selectRange(start, end)` is called:

1. Resolve plural category for both start and end values
2. Lookup `pluralRanges[`${startCategory}_${endCategory}`]`
3. Fall back to end category if no mapping exists

## Key Design Decisions

- **Build-time compilation**: No runtime rule parsing — CLDR rules compiled to JS functions during build
- **No make-plural dependency**: Custom compiler replaced previous make-plural dependency
- **BigInt support**: `ToIntlMathematicalValue()` handles BigInt per ECMA-402
- **String-based integer digits**: Stored as string for numbers > 2^53 to prevent precision loss
- **Notation options**: The current ECMA-402 draft includes notation and compactDisplay; compact exponents use generated locale data

## Examples by Locale Complexity

- **Chinese**: Always returns "other" (no plural forms)
- **English**: Cardinal: one/other; Ordinal: one/two/few/other
- **French**: Cardinal: one/many/other (compact notation uses `e` operand for "many")
- **Arabic**: Cardinal: zero/one/two/few/many/other (most complex, uses all 6 categories)

## Draft options and range behavior

`notation` accepts `standard`, `scientific`, `engineering`, and `compact`.
`compactDisplay` is validated for every notation and reported only for `compact`.
Compact notation uses the shared compact digit defaults. `resolvedOptions()`
returns an ordinary object, reports notation and rounding settings, and lists
plural categories in the order `zero`, `one`, `two`, `few`, `many`, `other`.
`selectRange()` accepts infinite endpoints; NaN still throws `RangeError`.

Compact plural selection uses generated CLDR exponent tables for locales whose
rules use `c`/`e`. It does not require NumberFormat locale data to be installed.

## Rust port

`crates/intl_pluralrules` loads individual CLDR JSON packs into ICU4X rules.
`//crates/intl_pluralrules:locale_data` emits one `locale-data/<locale>.json`
per locale in the existing `ALL_LOCALES` list. Cardinal/ordinal rules retain the
original CLDR conditions; sample annotations are removed. Range matrices and
compact exponent tables accompany the rules. The TS and Rust data pipelines
share `scripts/compact-exponents.ts`.

The rule engine owns loaded payloads and has no global locale registration or
baked plural data. `tests:rule_conformance_test` compares all packs with the TS
compiler over 100,000+ samples. `digits::Digits` now implements typed digit-option resolution and exact decimal
rounding; `tests:digit_conformance_test` compares selection, ranges and metadata
with the public TS API. The Hermes adapter implements constructor behavior
and ships in the standalone SDK.

Conformance also covers canonical aliases during TS data registration (`sh`
registers as `sr-Latn`), exact digit-string modulo beyond Number precision,
integer-only CLDR `n` membership, and fractions longer than ICU4X's default
18-digit operand window. Both engines retain visible fraction width and compute
modulo before converting digits to bounded integers.

`instance::PluralRules` owns validated type/notation/digit options and shares an
immutable rule payload. The conformance runner exercises this production API for
selection, ranges and complete resolved metadata. Host adapters handle observable
JS coercion before constructing an instance; the registry negotiates locale tags
with the shared Rust Locale matcher.

The Rust registry loads packs atomically, registers canonical default-content
aliases and required fallbacks, and protects explicitly loaded payloads from
alias replacement. Existing instances keep their selected data after late loads.
Generated packs carry alias metadata; no other locale pack loads implicitly.

The shared Hermes archive exports PluralRules registry/load/create/query/free
functions from `ffi.rs`. Handles own their data; input buffers never escape a
call. ABI tests cover registry replacement/destruction, owned output, invalid
UTF-8, atomic failed loads, lazy non-finite options and RangeError/TypeError codes.

Locale matching shares the TS matcher's CLDR distance rules, region variables
and paradigm locales through generated Rust metadata in `intl_locale`. Prefix
lookup strips only Unicode extensions; supported locale results retain requested
tags. Best fit preserves exact/maximized fast paths and request-order penalties.

`native/hermes:pluralrules_bridge_test` runs a TypeScript factory fixture through
the real Hermes runner and C++ adapter. It tests owned host objects, native
matching, ranges, error codes and late locale replacement. The runner accepts
`--extensions=<bundle>` for source or optimized-bytecode factory bundles.
The public constructor/coercion facade uses `pluralrules.ts`. The standalone
SDK ships that installer, the C++ adapter and selected per-locale JSON packs;
its independent consumer verifies lazy loading with downloaded native artifacts.

Mathematical-input normalization handles StringNumericLiteral syntax, radix
integers, IEEE Number-range clamping and BigInt's early return. Normal finite
values use fixed_decimal; huge BigInt integers use prefix/suffix string rounding
to avoid its i16 magnitude limit. Plural operands read decimal text directly.
TS regression coverage rejects malformed numeric text and preserves exact radix
values before the shared TS/Rust mathematical conformance comparisons.

The Hermes facade owns only observable JS behavior: receiver allocation, option
getter/coercion order, ToPrimitive, brands, descriptors and fresh result objects.
Rust owns matching, validated options, numeric parsing/rounding and selection.
Public native conformance runs source/optimized-bytecode installers against TS over 10,000+
selections/ranges, with separate checks for tampered intrinsics and edge ordering.

The SDK ships the PluralRules C++ adapter, source/precompiled factories and
individual JSON packs. The independent consumer links `:pluralrules`, embeds
only English/French packs and a compiled TypeScript smoke script, then registers
French after creating an English instance. BuildBuddy builds and cross-builds;
macOS executes the downloaded consumer without building.

### Native compiled provider

The Hermes SDK now embeds build-selected locale records in Rust rather than
shipping locale JSON for application registration. Rust validates the existing
CLDR data and compiles plural rules at build time; calendar locale patches merge
into DateTimeFormat records. Per-registry lazy caches isolate mutable overrides.
The explicit-registration targets retain custom-provider and TS conformance use.
See [native data setup](../native/hermes/README.md#compiled-locale-data).

### Independent ICU checks

The pinned ICU4J oracle generates 720 default-precision selections across 12
locales, cardinal/ordinal rules, integers and fractions. ICU4C and ICU4X check
those same results independently; Hermes checks source and bytecode modes.
C/J use formatted-number operands with 0–3 fraction digits and half-up rounding,
avoiding binary-double operand differences. ICU4X receives exact decimals.
These cases do not replace digit-option, range or JS semantics coverage.

When best fit finds no match, the plural registry tries prefix lookup before
using its default locale. This keeps `zh-TW` on the available `zh` rules instead
of English when only a Chinese language payload is shipped.

### Hermes hot paths

Omitted constructor options use Rust's validated defaults directly; explicit
options still undergo JS getter access, coercion and validation in spec order.
The private options record has a null prototype and primitive values, so one
captured `JSON.stringify` call cannot invoke inherited `toJSON` hooks.

Selection binds the captured WeakMap getter once. Primitive Numbers bypass the
temporary mathematical-value record, retaining negative zero and non-finite
values. Other inputs keep the observable ToPrimitive path. Default metadata and
selection are compared with TS across the existing 13-locale fixture set;
source/bytecode, intrinsic-poisoning and test262 guards remain in place.
