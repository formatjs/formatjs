# formatjs_intl_collator

ECMA-402 Collator records with Rust locale resolution and UCA comparisons.
Bazel serializes the existing CLDR FractionalUCA root, prefix mappings, LDML
sort/search tailorings and locale metadata into one compiled dataset. ICU4X
provides NFD normalization and locale-sensitive case mapping. Lone UTF-16
surrogates remain distinct throughout comparison.

The comparison profile mirrors TS: contractions, contextual mappings, recursive
imports, before-resets, per-level weights, numeric runs and caseFirst. It retains
the TS profile's compact implicit weights and variable-element
filtering; this is not a claim of full ICU Collator ordering parity. Keeping the
CLDR search rules avoids losing search support from default ICU4X baked data.

On Linux:

```sh
bazel test -c opt //crates/intl_collator:intl_collator_test \
  //crates/intl_collator/tests:conformance_test
```

Conformance ports the existing native/TS TSV corpus, covers all available locales
and advertised collations, and compares sensitivity/numeric/caseFirst/punctuation/
usage combinations against TS. The owned C ABI and Hermes source/bytecode tests
cover private brands, observable option/coercion order and cached bound functions.
SDK target `:collator` ships headers, adapter, extension fragment and typed smoke
example. Sensitivity selects UCA levels after tailoring; it never strips primary
locale distinctions before matching.
