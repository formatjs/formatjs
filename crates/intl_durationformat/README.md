# formatjs_intl_durationformat

Rust duration records, formatting-option resolution and number/list rendering.
Locale resolution, C ABI, Hermes installation and SDK integration remain in progress.

`Duration::from_numbers` accepts ten optional Number values in `Unit::ALL` order.
It requires at least one defined field, finite integral values, a common sign,
calendar magnitudes below `2 ** 32`, and exact normalized seconds below `2 ** 53`.
Number values become their mathematical integers, preserving bits that a shortest
decimal spelling can hide. `from_integers` validates already-normalized records.
Subsecond bounds use checked integer arithmetic without an IEEE rounding step.

`Configuration::new` resolves overall style, per-unit styles/displays and optional
fractional digits. Numeric clock styles force subsequent minutes/seconds to two
digits; subsecond numeric styles normalize internally to fractional. Public
serialization reports those styles as numeric in specification property order.
Explicit styles retain their distinct display defaults.

Hosts with observable getters can use `UnitResolver` in `Unit::ALL` order:
`prepare` validates the style and computes its display default, then `finish`
validates the display and cross-unit constraints. Read each display getter between
those phases. Hosts remain responsible for ToNumber/ToString and primitive errors.

Native tests cover exact subsecond bounds, mixed signs, Number integers beyond the
safe-integer range and style transitions. TS differential coverage compares
formatting-option resolution/property order and record validation against the
existing implementation.

`Renderer` owns selected native NumberFormat/ListFormat registries. Register existing
native packs through `add_number_data` and `add_list_data`; unit sidecars use
`add_number_unit_data`. `format_to_parts` accepts resolved locale, numbering system,
time separator, configuration and duration. Dependency registries negotiate their
locales independently and can load after configuration construction. Cached option
profiles retain their original data after replacement; new profiles see new packs.

Subsecond values fold with integer arithmetic before decimal truncation. Numeric
clock fields disable grouping, retain intervening zero minutes and display the sign
once, including on a leading zero. Number parts carry singular units; list and
clock separators do not. No JS formatter callbacks or bundled number/list packs.

Eight-locale TS differential coverage checks 2,176 rendering cases, including all
base styles, numbering systems, exact fractions and negative leading zero. Native
lifecycle checks cover late loading, missing dependencies, independent locale
fallback and formatter snapshots across pack replacement.
