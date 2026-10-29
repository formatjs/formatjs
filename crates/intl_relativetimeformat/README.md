# formatjs_intl_relativetimeformat

Rust RelativeTimeFormat core with on-demand CLDR packs. Each pack owns relative
patterns and the matching NumberFormat/PluralRules data. No host ICU data or JS
formatters are needed. The owned C ABI, Hermes source/bytecode installers and
standalone SDK are available.

`Registry` starts empty. Register selected JSON files from `:locale_data`, then
call `create` with requested locales and typed options. Lookup/best-fit matching
only considers loaded relative locales. Explicit records take precedence over
aliases and synthesized parents; existing instances retain their owned records
when another pack replaces a locale.

`resolve` fixes locale and numbering-system selection. `create_resolved` reads
current fields afterward, matching TS when later style/numeric getters register
replacement data. Hosts must preserve that phase boundary.

Immutable packs reuse internal NumberFormat records by resolved locale and
numbering system, with at most 64 short keys per pack. Each RelativeTimeFormat
retains its own options and shares an owned number record. Formatting takes no
cache lock; replacing a pack creates a separate cache and leaves old instances
intact.

`format` and `format_to_parts` accept normalized Number text after host ToNumber,
including a distinct `-0`, plus singular/plural unit identifiers. Nonfinite values
and invalid units reject. Numeric `auto` uses named forms before past/future
selection; numeric `always` preserves negative-zero past tense. Missing narrow or
short fields fall back to long, and missing plural categories fall back to other.
Only number-derived parts carry a singular `unit` property.

```sh
bazel test -c opt //crates/intl_relativetimeformat/...
```

Core tests cover ownership, replacement timing, atomic load failure, negative
zero, parts and CLDR fallback. Differential tests compare every generated locale,
all styles/numeric modes, units, numbering systems, Unicode extensions and numeric
edge cases against TS with real NumberFormat/PluralRules implementations.

The ABI in `relativetimeformat.h` separates locale/nu resolution from final
creation, preserving the field lookup phase after host getters. Handles survive
registry destruction. Queries carry normalized Number text plus original UTF-16
unit codes; lone surrogate units produce RangeError instead of an ABI error.
Byte serialization preserves type/value/unit part property order. Status 1 maps
to RangeError; 2 reports invalid ABI input and 3 a caught panic. Hosts own
ToNumber/ToString sequencing and BigInt/Symbol TypeErrors. Destroy each handle
and free each successful byte result exactly once.

Hermes callers link `//native/hermes:relativetimeformat` and install after
canonicalization with `formatjs::installRelativeTimeFormat(runtime)`. The
precompiled overload takes the extensions object containing
`39-IntlRelativeTimeFormat.js`. Register selected JSON strings through
`Intl.RelativeTimeFormat.__addLocaleData(jsonText)`; the registry starts empty.
The [standalone SDK](../../native/hermes/package/README.md) packages headers,
adapter sources, factories, typed smoke example and locale packs.

Actual Hermes source and optimized-bytecode tests cover 25,792 cases per mode,
including coercion order, method brands, getter-time replacement, part property
order and operation without global NumberFormat/PluralRules constructors.

## Compiled provider

`:with_compiled_data` embeds build-selected binary locale records.
`Registry::with_compiled_data()` makes those locales available without JSON
registration. DateTimeFormat also exposes `Runtime::with_compiled_data()`.
Select locales with `--//crates/intl_data:locales=en,fr`; the default follows Chromium desktop's full-data UI language filter, including regional
and script variants available in this checkout. Use `--//crates/intl_data:locales=\*`
to include every CLDR locale.
Rust validates packs and compiles plural rules during the build. Records decode
lazily into per-registry caches; mutable data never crosses registry boundaries.
The original target and `Registry::default()` retain explicit registration for
custom providers. See [Hermes data setup](../../native/hermes/README.md#compiled-locale-data).
