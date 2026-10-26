# formatjs_intl_pluralrules

ICU4X category selection from caller-loaded CLDR rule packs. Each pack carries
one locale's cardinal/ordinal rules and range matrices. Loading compiles rules
once and owns the result; no baked plural data or global registration is needed.

Work in progress: ECMA-402 digit rounding, locale negotiation/registration,
generated per-locale packs, TS conformance, Hermes binding and SDK integration.
`select_rounded` is the typed rule engine, not the complete Intl API.

On Linux:

```sh
bazel test //crates/intl_pluralrules:intl_pluralrules_test
```
