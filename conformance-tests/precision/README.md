# Keep trailing zeros conformance

Tests follow the [Keep trailing zeros draft](https://tc39.es/proposal-intl-keep-trailing-zeros/).
`fixtures.tsv` supplies 27 core rounding cases with explicit source digit counts.
`public-fixtures.tsv` supplies 17 original String inputs; TS/Rust public APIs must
infer their precision without supplied counts. Public NumberFormat conformance
also checks ranges, notation, percent scaling, strip modes and primitive kinds.
Hermes conformance runs the same production implementations in source/bytecode modes.

ICU4C and ICU4J independently check all 44 expected texts using explicit precision
skeletons. They also check English plural operands for non-notation cases.
ICU does not infer the draft's source counts or implement `stripToMinimum`:
each skeleton sets the corresponding precision for its individual case. The core
TS/Rust tests check count handling and rounding together. Public TS/Rust tests
check inference, and parser tests assert the Intl MV fields directly.

Run `bazel test //conformance-tests/precision:all` and
`bazel test //crates/intl_numberformat/tests:conformance_test`.
