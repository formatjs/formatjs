# @formatjs/intl-segmenter

**ECMA-402 Section 19** — `Intl.Segmenter`

## Purpose

Polyfill for `Intl.Segmenter` — performs text segmentation at grapheme, word, and sentence boundaries using CLDR segmentation rules and Unicode character properties.

## Dependencies

- `@formatjs/ecma402-abstract`, `@formatjs/intl-localematcher`

## CLDR Data Pipeline

### Sources

| Source                           | Data Used                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cldr-segments-full`             | suppressions.json — segmentation rules per locale                                                                                                                       |
| Unicode Character Database (UCD) | GraphemeBreakProperty, WordBreakProperty, SentenceBreakProperty, DerivedCoreProperties, DerivedCombiningClass, DerivedEastAsianWidth, IndicSyllabicCategory, emoji-data |

The UCD files are downloaded as `http_file` rules in MODULE.bazel from unicode.org (Unicode 17.0.0).

### Extraction Script (`scripts/generate-cldr-segmentation-rules.ts`)

The most complex data generation script in the repo. Processes 11 locale rule sets (de, el, en, es, fr, it, ja, pt, ru, und, zh):

1. **Parse CLDR segmentation rules**: XML/JSON rules with variable definitions and break/no-break rules
2. **Variable substitution**: Expands variables like `$RI`, `$FE`, `$Extend` into full Unicode property expressions
3. **RegExp compilation**: Converts Unicode property expressions to JavaScript RegExp patterns using `regexpu-core`
4. **Transparency injection**: Inserts Format/Extend character handling into rules at appropriate points
5. **Surrogate pair workarounds**: Handles limitations in JS regex with supplementary Unicode characters

### Build Pipeline

Single-stage static compilation:

```
generate_src_file "generate-cldr-segmentation-rules"
  Input: cldr-segments-full + UCD files (8 Unicode data files)
  Output: src/cldr-segmentation-rules.generated.ts
  Dependencies: @unicode/unicode-17.0.0, regexpu-core, regenerate
```

### Generated Data Structure

```typescript
export const CLDR_SEGMENTATION_RULES: Record<Granularity, Record<Locale, RuleSet>> = {
  grapheme: {
    "und": {
      variables: {"$CR": "\\u000D", "$LF": "\\u000A", ...},
      segmentRules: [
        {type: "break", before: "...", after: "..."},
        {type: "noBreak", before: "...", after: "..."},
        ...
      ]
    }
  },
  word: {...},
  sentence: {...}
}
```

### Runtime Loading

- **No dynamic locale loading** — all rules compiled into main bundle
- Static data structure passed to segmentation engine
- Segmentation algorithm walks text character by character, applying rules in priority order
- Known limitation: 35 test cases fail for Regional Indicator + Extend combinations

## Iteration and default locale

`segment()` returns a reusable iterable with `containing()`. Each call to its
`Symbol.iterator` creates an independent iterator. An iterator returns itself
from `Symbol.iterator` and resumes from its current position. `next()` belongs
to the iterator, not the iterable returned by `segment()`.
The fallback locale is `en`, backed by the root segmentation rules.

`containing(index)` coerces its index to a number and truncates toward zero.
BigInt values throw `TypeError`, including boxed BigInts and objects that
coerce to BigInt. Errors thrown during coercion propagate unchanged.

Available locales come from pinned CLDR locale metadata, including default-content
variants and required fallback tags. Locales without tailoring use root UAX rules;
regional locales retain their language's tailoring and sentence suppressions.

## Rust port

`crates/intl_segmenter` uses ICU4X grapheme/word/sentence models with content-locale
tailorings and complex-script dictionary/LSTM support. UTF-16 input remains exact,
including lone surrogates. Segments share an immutable boundary index; cursors
advance independently and `containing` finds enclosing code-unit boundaries.
Locale metadata mirrors the TS available-locale set through Bazel generation.

Core conformance ports the Unicode 17 grapheme corpus and audits TS records and
`containing` results across granularities/locales. Word/sentence boundaries and
word-like classification are implementation-dependent. Tests pin both profiles
for dictionary words, abbreviation suppressions, Format/Close/Sp handling and
isolated marks. Unicode letter/number categories supplement ICU word status for
Indic text. No corpus cases are skipped.

The owned ABI retains UTF-16 tables after parent destruction and gives each
cursor independent progress. Hermes uses private WeakMaps for brands and retains
the constructing JS Segmenter. Source/optimized-bytecode tests cover coercion order,
iterator prototypes, property order and UTF-16 indices. SDK `:segmenter` includes
public headers, source, `36-IntlSegmenter.js` and a compiled TypeScript smoke example.
Linux builds/cross-builds the SDK; native runners download and smoke-test artifacts.
Segmentation data stays static, matching the existing package.
