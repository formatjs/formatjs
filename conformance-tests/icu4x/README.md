# Pinned ICU4X comparisons

RelativeTimeFormat compares 19,008 outputs against `icu_experimental` 0.6.0:
12 locales, default/Latin/Arabic digits, all styles, numeric modes and units,
including negative zero, decimals and grouped values. Repeated constructions
exercise shared internal number records with different public options.

`relative-icu4x-differences.tsv` pins 1,440 differences in number separators.
ICU4C 78.1 and ICU4J 78.1 independently verify every preferred output. Their
internal DecimalFormat uses grouping `auto` and 0–3 fraction digits, matching
ECMA-402's internal NumberFormat rather than legacy ICU grouping defaults.
ICU4X retains locale separators for these numbering-system overrides. No output
is normalized. Unlisted differences, changed outputs and unused rows fail.

```sh
bazel test -c opt //conformance-tests/icu4c:intl_relativetimeformat_conformance_test //conformance-tests/icu4j:intl_relativetimeformat_conformance_test //conformance-tests/icu4x:intl_relativetimeformat_conformance_test
```

PluralRules includes 720 single-value cardinal/ordinal cases plus 224 cardinal
ranges across 14 locales, including zh-TW, zh-HK and zh-Hant-HK. The range matrix
uses default 0–3 fraction digits and covers equal, reversed, negative and decimal
endpoints. ICU4J generates the fixtures; ICU4C and ICU4X independently verify
them, and Hermes source/bytecode checks the ECMA results. Raw ICU range categories
remain separate from ECMA-402's single-value rule for equal formatted endpoints.
The matrix does not cover ordinal ranges or every rounding configuration.

[18 exact range differences](plural-range-icu-differences.tsv) retain
ICU4C/J raw and identity-adjusted results, ICU4X raw results, and preferred ECMA
results. Eight concern equal endpoints before identity handling. Ten reflect
missing range-pair fallback: FormatJS and ICU4X use the end category, as specified
by [CLDR](https://unicode.org/reports/tr35/tr35-numbers.html#Plural_Ranges);
ICU4C/J use `other`. Changed outputs, unknown differences and unused rows fail.

CLDR leaves negative and non-increasing ranges undefined; those cases pin each
implementation's choice rather than establish a universal required category.

ListFormat compares 3,069 scalar-string cases against `icu_list` 2.3.0.
[69 exact differences](list-format-icu-differences.tsv) pin ICU4X and preferred
ICU4C/J outputs separately; unknown, changed and unused differences fail.
Another 99 lone-surrogate cases remain covered by ICU4C/J and Hermes because
ICU4X strings cannot represent them. All styles and types, empty elements and
Spanish/Hebrew contextual patterns remain in the shared corpus.

Private-use canonicalization compares 21 tags independently with ICU4C 78.1,
ICU4J 78.1 and ICU4X `icu_locale` 2.3.1. The shared corpus covers base-language
aliases, mixed casing, zh-TW/zh-HK, single-character private subtags, long
suffixes and preceding Unicode extensions. Both FormatJS canonicalization and
Rust Locale constructors must match every pinned output; no differences are
normalized or skipped. Structural rejection remains covered by the existing
canonicalizer tests and strict Hermes getCanonicalLocales Test262 suite.

Segmenter checks 1770 UTF-16 cases generated independently by ICU4J 78.1 and
verified by ICU4C 78.1. The same corpus checks FormatJS and direct ICU4X
`icu_segmenter` 2.3.0 across grapheme, word and sentence granularities, ten
locales including zh-TW/zh-HK, dictionary scripts, emoji, combining marks and
lone surrogates. No cases are skipped. FormatJS matches every ICU4C/J record.
One hundred exact ICU4X word-status differences (Indic, underscore and Format
context) are pinned in
`segmenter-icu-differences.tsv`; unknown, changed, redundant and unused
entries fail. FormatJS classifies word status from pinned Word_Break/Alphabetic properties,
matching ICU4C/J without inheriting ICU4X status.
