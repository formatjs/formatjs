# formatjs_intl_relativetimeformat

Rust RelativeTimeFormat core with on-demand CLDR packs. Each pack owns relative
patterns and the matching NumberFormat/PluralRules data. No host ICU data or JS
formatters are needed. The owned C ABI is available. Hermes installation and SDK packaging remain in
progress.

`Registry` starts empty. Register selected JSON files from `:locale_data`, then
call `create` with requested locales and typed options. Lookup/best-fit matching
only considers loaded relative locales. Explicit records take precedence over
aliases and synthesized parents; existing instances retain their owned records
when another pack replaces a locale.

`resolve` fixes locale and numbering-system selection. `create_resolved` reads
current fields afterward, matching TS when later style/numeric getters register
replacement data. Hosts must preserve that phase boundary.

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
