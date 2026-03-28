# @formatjs/intl-pluralrules

**ECMA-402 Section 16** — `Intl.PluralRules`

## Purpose

Polyfill for `Intl.PluralRules` — evaluates CLDR plural rules to select plural categories (zero, one, two, few, many, other) for 227 locales. Also supports ordinal rules and plural ranges (LDML-43).

## Dependencies

- `@formatjs/ecma402-abstract`, `@formatjs/intl-localematcher`, `@formatjs/bigdecimal`

## CLDR Data Pipeline

### Sources

| CLDR File                                  | Data Used                                    |
| ------------------------------------------ | -------------------------------------------- |
| `cldr-core/supplemental/plurals.json`      | Cardinal plural rules per locale             |
| `cldr-core/supplemental/ordinals.json`     | Ordinal plural rules per locale              |
| `cldr-core/supplemental/pluralRanges.json` | Plural range mappings (start_end → category) |

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
  Input: plurals.json + ordinals.json + pluralRanges.json
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
2. Extract operands: split integer/decimal parts, compute n, i, v, w, f, t
3. Call compiled function: `localeData.fn(numberString, isOrdinal, compactExponent)`
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
- **Compact notation extension**: Non-standard but mirrors Intl.NumberFormat for consistent plural selection

## Examples by Locale Complexity

- **Chinese**: Always returns "other" (no plural forms)
- **English**: Cardinal: one/other; Ordinal: one/two/few/other
- **French**: Cardinal: one/many/other (compact notation uses `e` operand for "many")
- **Arabic**: Cardinal: zero/one/two/few/many/other (most complex, uses all 6 categories)
