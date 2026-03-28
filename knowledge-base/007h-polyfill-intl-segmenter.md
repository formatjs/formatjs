# @formatjs/intl-segmenter

**ECMA-402 Section 18** — `Intl.Segmenter`

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
