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

`//crates/intl_pluralrules:locale_data` generates one JSON file per locale from
CLDR cardinal/ordinal rules and range data. `formatVersion: 1` packs include
compact-exponent metadata when needed. The pack generator shares that extraction
with the TS pipeline. Applications can ship and load selected files independently.

`//crates/intl_pluralrules/tests:rule_conformance_test` compares every generated
locale with the real TS rule compiler over 100,000+ category selections, including
fraction zeros, compact exponents, large integers and non-finite inputs. This
checks the rule engine; complete Intl API conformance follows digit rounding.
