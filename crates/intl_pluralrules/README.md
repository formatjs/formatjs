# formatjs_intl_pluralrules

ICU4X category selection from caller-loaded CLDR rule packs. Each pack carries
one locale's cardinal/ordinal rules and range matrices. Loading compiles rules
once and owns the result; no baked plural data or global registration is needed.

`instance::PluralRules` provides validated options, matching, rounding and selection.
The Hermes adapter supplies observable JS coercion and the public Intl API;
`select_rounded` exposes the lower-level rule engine.

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
checks the rule engine independently of digit rounding and host coercion.

`digits::Digits` resolves already-coerced ECMA-402 digit options and rounds exact
decimals with `fixed_decimal`. Covers all nine modes, supported increments,
fraction/significant precision, priority and trailing-zero display. Its fields
serialize as resolved digit options. `tests:digit_conformance_test` compares
public TS selection, range results and resolved options across 13 locales and
900+ configurations. Native builds and cross-builds run on Linux.

`instance::PluralRules` retains an `Arc<LocaleRules>` and validated options.
It handles rounding, compact scale, selection, ranges and resolved metadata;
the differential runner uses this same instance API. JS coercion remains host
adapter work. The registry negotiates canonical requested tags in Rust.

`registry::Registry` loads packs atomically, adds CLDR default-content aliases
and parent/scriptless fallbacks, and preserves explicitly loaded data. Instances
keep their payload when a later load replaces a registry entry. Available locales
and the first-loaded default belong to each registry, not a process global.
`tests:registry_conformance_test` compares availability, defaults, resolved
locales and selection against TS across alias/explicit-data load orders.

`pluralrules.h` exposes owned registry/instance handles in the shared Hermes
Rust archive. JSON requests contain already-coerced primitives; non-finite digit
Numbers use private string sentinels. Successful query buffers must be freed
once. Instances remain valid after registry destruction.

`//native/hermes/tests:pluralrules_conformance_test` compares the public Hermes
API with TS through source and optimized-bytecode installers. The standalone
SDK includes the adapter and individual JSON packs; its independent consumer
checks on-demand loading on Linux and the cross-built macOS executable.

Mathematical-input entry points parse numeric strings/radix literals exactly,
apply Number overflow/underflow clamping, and keep BigInt outside that clamp.
Arbitrary-length integers use string rounding when ICU's magnitude range is too
small. The mathematical conformance suite compares TS selection and ranges,
including 40,000-digit BigInt and long halfway fractions.

## Compiled provider

`:with_compiled_data` embeds build-selected binary locale records.
`Registry::with_compiled_data()` makes those locales available without JSON
registration. Select locales with `--//crates/intl_data:locales=en,fr`; the default is all locales.
Rust validates packs and compiles plural rules during the build. Records decode
lazily into per-registry caches; mutable data never crosses registry boundaries.
The original target and `Registry::default()` retain explicit registration for
custom providers. See [Hermes data setup](../../native/hermes/README.md#compiled-locale-data).
