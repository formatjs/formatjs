# formatjs_intl_durationformat

Rust duration records and formatting-option resolution. Locale resolution,
number/list rendering, C ABI, Hermes installation and SDK integration remain in
progress.

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
