# formatjs_intl_durationformat

Rust duration records, locale/formatting-option resolution and number/list rendering.
Owned C ABI and Hermes facade are available; SDK packaging includes both installers, native headers/adapters and a typed consumer smoke.

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

`DurationFormat::new` resolves requested locales and `ResolutionOptions` against
statically compiled CLDR duration metadata, then resolves formatting options. Its
`format`/`format_to_parts` methods select the locale's numbering-system separator
and use the supplied dependency renderer. `resolved_options` serializes locale and
numbering system before configuration fields. `available_locales` remains static
regardless of dependency registration; `supported_locales` preserves canonical
requested extensions with prefix filtering for both matcher settings.

For observable construction, call `Renderer::resolve_locale` before reading style
and unit options, then `DurationFormat::from_resolution` with the completed
configuration. The resolution snapshot survives dependency loading between those
phases. Numbering-system support is probed through native NumberFormat; an empty
probe retries after locale loading. Successful capability probes remain cached,
matching the TS dependency constructor lifetime. Locale negotiation and option
ordering are compared across all 766 CLDR locales with lookup and best-fit.

The C ABI in `durationformat.h` exposes retained dependency contexts, construction
handles, formatter handles and owned JSON byte results. `begin` resolves locale;
`style` runs once, followed by `unit_style`/`unit_display` pairs for canonical
indices 0 through 9. `finish` validates fractional digits last. Invalid, repeated
or skipped phases fail without producing a handle. Styles/displays cross as JSON
strings or null for defaults; hosts retain observable coercion and getter order.

`DurationValue` carries ten doubles and a defined-field mask, preserving Number
integers without decimal conversion. Formatting returns either a JSON string or
parts. Status codes distinguish RangeError/data errors, invalid ABI input, panic,
TypeError and missing-dependency Error. All output pointers reset before failure.
Free successful bytes and destroy owned handles once. Formatters and construction
handles retain their context after registry destruction; the context is synchronized
and contains no host callbacks or thread-bound JS values. Native lifetime coverage
also formats and drops the final owner on a worker thread. `intl_hermes` exports the
ABI through the shared Rust archive.

The Hermes facade is `//native/hermes:durationformat`. It preserves observable JS
coercion/brands, reads ordinary record fields once in specified order and uses
phased native option validation. Both installers share one factory: evaluated
source or precompiled `IntlDurationFormat`. Typed Number arrays cross JSI without
JSON decimal conversion. Temporal must exist before installation; captured
intrinsic getters/from support branded durations and strings despite later public
prototype changes. See [Hermes integration](../../native/hermes/README.md#durationformat).
