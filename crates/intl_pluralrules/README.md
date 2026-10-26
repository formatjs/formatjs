# formatjs_intl_pluralrules

ICU4X category selection from caller-loaded CLDR rule packs. Each pack carries
one locale's cardinal/ordinal rules and range matrices. Loading compiles rules
once and owns the result; no baked plural data or global registration is needed.

Work in progress: locale negotiation, complete Intl API
orchestration, Hermes binding and SDK integration.
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

`digits::Digits` resolves already-coerced ECMA-402 digit options and rounds exact
decimals with `fixed_decimal`. Covers all nine modes, supported increments,
fraction/significant precision, priority and trailing-zero display. Its fields
serialize as resolved digit options. `tests:digit_conformance_test` compares
public TS selection, range results and resolved options across 13 locales and
900+ configurations. Linux native validation is required before completion.

`instance::PluralRules` retains an `Arc<LocaleRules>` and validated options.
It handles rounding, compact scale, selection, ranges and resolved metadata;
the differential runner uses this same instance API. JS coercion and locale
negotiation remain host adapter work.

`registry::Registry` loads packs atomically, adds CLDR default-content aliases
and parent/scriptless fallbacks, and preserves explicitly loaded data. Instances
keep their payload when a later load replaces a registry entry. Available locales
and the first-loaded default belong to each registry, not a process global.
`tests:registry_conformance_test` compares availability, defaults, resolved
locales and selection against TS across alias/explicit-data load orders.

`pluralrules.h` exposes owned registry/instance handles in the shared Hermes
Rust archive. JSON requests contain already-coerced primitives; non-finite digit
Numbers use private string sentinels. Successful query buffers must be freed
once. Instances remain valid after registry destruction. JSI installation and
observable JS behavior remain in progress.
