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
