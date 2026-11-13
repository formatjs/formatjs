# Source precision rounding

Core tests for the [Keep trailing zeros draft](https://tc39.es/proposal-intl-keep-trailing-zeros/),
not public NumberFormat or PluralRules proposal coverage. Inputs carry the digit
counts an Intl MV record would retain, before percent or notation scaling.

`fixtures.tsv` pairs draft digit counts/options with explicit ICU precision
skeletons and expected decimal text. ICU does not parse the draft's source counts:
the skeleton sets the corresponding minimum precision for each individual case.
ICU4C and ICU4J independently check rounding/padding; TS and Rust check the draft
count handling and rounding together. This does not test the draft's input parser,
public `stripToMinimum` option, ranges or Hermes bridges.

Run `bazel test //conformance-tests/precision:all`.
