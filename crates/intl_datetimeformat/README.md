# formatjs_intl_datetimeformat

DateTimeFormat Rust port in progress. The current foundation provides TimeClip
and exact Gregorian civil fields from epoch nanoseconds. It handles astronomical
year zero, leap centuries, negative submilliseconds and timezone adjustments that
cross the Date range. No host Date/ICU is used.

`civil::time_clip` validates numeric Date inputs before truncating toward zero.
`CivilDateTime::from_epoch_nanoseconds` preserves submillisecond precision and
uses Euclidean division for negative instants. Months are 1–12; weekdays are
0–6 starting Sunday. `era_year` maps astronomical years to AD/BC display years.
Civil conversion allows month-edge padding for valid Temporal YearMonth reference
dates. Numeric inputs still pass strict TimeClip before timezone adjustment.

Host coercion, Hermes facade and SDK installation remain unfinished.

```sh
bazel test -c opt //crates/intl_datetimeformat/... \
  //packages/intl-datetimeformat:rust_timezone_test \
  //:rust_datetime_pattern_test \
  //:rust_datetime_pattern_test_typecheck_typecheck_test
```

Tests cover TimeClip endpoints, invalid numeric inputs, century rules, negative
nanoseconds and local offset crossings. Differential tests compare 8,193 instants
against the existing TS arithmetic across the full Date range.

## Timezones

`TimeZoneRegistry` starts without transitions. It compiles the pinned IANA alias
index and accepts selected full/golden JSON packs from `:timezone_data`.
`load_json` validates a pack before replacing the entire transition map. Existing
zone records consult the current registry, matching TS data replacement. Unknown
transition data falls back to UTC; malformed input leaves the old map intact.

`resolve` accepts ASCII case-insensitive IANA identifiers and minute offsets in
`±HH`, `±HHMM` or `±HH:MM` form. Zero offsets normalize to `+00:00`; seconds,
non-ASCII lookalikes and unknown names reject. Default timezone selection stays
explicit and starts at UTC. `local_time` returns civil fields plus exact historical
offset seconds and DST state, using binary search at transition boundaries.

Differential tests compare every generated full/golden transition at the preceding,
exact and following nanosecond, plus full Date bounds, aliases and fixed offsets.
The current packs cover 453 full zones and 247 golden zones: 428,850 transition and
boundary samples. Raw JSON equals the shipped JS registration payload in both
modes. Generation excludes zdump end markers beyond Date's range and parses only
IANA `Link` records as aliases.

## Patterns and matching

`pattern::parse` preserves LDML quoting, field widths, 12/24-hour variants and
interval endpoint sources. `matching` implements BasicFormatMatcher,
BestFitFormatMatcher and DateTimeStyleFormat, including hour preferences,
registration-order ties and numeric/named-month guards. Ordered raw patterns
preserve CLDR precedence; parsed records retain skeleton and actual pattern fields
separately.

`locale_patterns::CalendarPatterns` prepares one calendar on demand. Interval
selection normalizes raw time skeletons and matches date field presence while
preserving numeric versus named months. Date/time style connectors and fallback
intervals use the same preparation as the TS locale registry. This module contains
no locale packs or optional calendar arithmetic.

Differential tests cover LDML token widths, quoting, Unicode whitespace, range
sources and matcher penalties. The real CLDR corpus checks 71,421 patterns across
eight language families and all 15 calendars, including production registration,
interval fallback selection, styles and 15,120 matcher option combinations.

## Calendar providers

`calendar::CalendarRegistry` supplies Gregorian/ISO fields without optional data.
Months use the TS calendar contract's zero-based indices. Local milliseconds may
cross Date bounds after timezone adjustment. Other calendars require registered
`CalendarProvider` callbacks; unloaded calendars return `MissingCalendar`.
Provider records retain leap-month, related-year and cyclic-year fields.
Built-in optional providers live in `../intl_datetimeformat_calendars` and register
only when requested; this core crate does not link their arithmetic or tables.

`data::LocaleData` owns one raw CLDR locale record, including names, day-period
rules, timezone names and hour/numbering preferences. Calendar formats and styles
have separate lazy caches. Gregorian styles validate during loading; optional
calendars parse on use. ISO shares Gregorian formats while names/styles honor explicit calendar overrides. Availability requires both
patterns and a registered arithmetic provider, preserving locale preference order.

## Locale registry

`registry::Registry` loads raw locale JSON and optional calendar-locale patch JSON.
Patches can arrive before the base locale or arithmetic provider. Base reloads keep
patches; replacing a patch keeps its original registration position. Failed eager
style validation leaves published records unchanged.

The first base locale becomes the default. Registration uses the same CLDR
aliases as TS and fills scriptless/parent fallbacks without replacing explicitly
loaded locales. Reloads update inferred parents that still share the previous
record. `get` returns an owned snapshot; subsequent lookups see replacement data.
Locale payloads remain on demand; only default-content alias metadata compiles
into the registry.

`resolve` implements the locale/Unicode-extension phase of construction, including
lookup/best-fit matching, calendar/numbering aliases, supported option overrides,
and `hour12` suppression of the `hc` extension. Its hour cycle can remain null;
final pattern/hour-cycle selection happens later. `supported_locales` follows TS
lookup behavior for both matcher options. Differential tests cover registration,
patch/provider ordering, custom calendars, failed reloads and 12,600 negotiation
combinations against actual TS constructors and ResolveLocale.

## Construction and rendering

`selection::Snapshot::capture` retains locale/calendar records after component
options, before late matcher/style options. `select` prepares final patterns,
hour cycles, defaults, day periods and fractional-second separators.
`Configuration::temporal` lazily caches profiles for the six supported Temporal
types, preserving field restrictions and style conflicts.

`render::RenderData::capture` reads current locale names and retains the current
calendar provider before releasing registry borrows. Rendering uses current
timezone transitions, exact nanoseconds and locale NumberFormat digits. Plain
Temporal values use zero-offset arithmetic with the configured timezone name.
Date bounds, eras, standalone grammar, flexible day periods, DST names and GMT
fallbacks follow TS behavior. Host coercion and Temporal brand checks remain
unfinished.

`//crates/intl_datetimeformat:locale_data` generates 766 separate base JSON packs.
Each includes Gregorian/ISO patterns and its native NumberFormat payload under
`number`; optional calendars and timezone transitions remain separate loads.
Raw TS locale JSON still loads for metadata/pattern use; numeric rendering needs
the native pack. NumberFormat instances cache per locale, numbering system and
minimum integer width; two-digit truncation counts Unicode code points.

`:calendar_<calendar>_locale_data` exposes each optional calendar's existing
JSON patches; `:calendar_locale_data` collects all 14 calendars. These targets
reuse the TS generator and remain separate from base packs and the core library.
Patch loading alone does not make a calendar available: arithmetic registration
is still required.

Differential tests cover 4,368 construction configurations and their Temporal
profiles, 53,760 numeric rendering cases, exact Temporal instants, reloads and
every generated base pack. Generator regressions cover CLDR `hB`/`hb` hour-cycle
tokens and timezone widths missing standard names, which use GMT fallback.

`render::RangeSnapshot` retains comparison metadata before endpoint callbacks.
Convert each endpoint with a freshly captured provider, then capture rendering
data after both conversions. `LocalTime` retains exact civil/calendar fields and
offsets, avoiding repeated callbacks during partitioning. Ranges collapse at
displayed precision, preserve shared grammatical context, and assign endpoint
sources without changing cached fallback patterns. Differential tests compare
76,800 numeric ranges and 288 exact Temporal ranges, including Date bounds,
historical offsets, DST, supplementary digits and reversed endpoints.

## Owned formatter

`Runtime` owns shared locale/provider state and timezone transitions. Clones share
registrations. `begin` captures timezone-name availability before host locale and
option coercion. `Construction::resolve` handles early locale options;
`time_zone` validates explicit names against that snapshot while reading the
current default when omitted. `capture` prepares the component-phase locale
snapshot; select its late options, then `finish` creates `DateTimeFormat`.
Carry the already-read `hour12` option into `Components` without rereading it.

`DateTimeFormat` provides `resolved_options`, `format`, `format_to_parts`,
`format_range` and `format_range_to_parts`. `DateTimeValue` accepts numeric Date
values or normalized Temporal records. It validates calendar compatibility,
rejects ZonedDateTime, and requires matching range types before handling values.
Resolved options preserve property order and omit components for styled formats.

Calendar callbacks can register replacement providers and locale patches through
the same runtime. Registry borrows end before callbacks run; each range endpoint
captures the current provider separately. A single format retains names captured
before conversion, while range parts read names after both conversions.
The Hermes facade supplies JavaScript coercion, Date.now defaults and captured
intrinsic Temporal brand detection. Its installation guard owns thread-bound
cleanup; GC finalizers queue IDs instead of dropping Rust records.

## C ABI

`datetimeformat.h` exposes owned registry, construction and formatter handles.
Call `begin` before locale/option coercion, then `resolve`, `zone`, `capture` and
`create` in order. Capture forces current calendar formats before late style
getters. A finalization attempt consumes captured state. The registry accepts
native base packs, calendar locale patches and timezone packs independently.

Queries return JSON for resolved options, strings or parts. Numeric values use
strings so NaN, infinity and negative zero cross JSON intact. Epoch records carry
exact nanosecond strings; plain records accept intrinsic ISO serialization with
calendar annotations. Date-only references use noon, preserving the source
Temporal conversion, and YearMonth references may exceed numeric Date bounds.
Resolved options serialize directly in specification property order.

Statuses distinguish RangeError/data failures (1), invalid ABI/state (2), panic
(3), TypeError (4) and foreign calendar exceptions (5). Handles remain on their
creating thread; destroy each handle and free each successful byte result once.
Formatters retain runtime state after registry-handle destruction. Queries retain
the formatter during callbacks, allowing reentrant handle destruction.

Calendar callbacks receive adjusted local milliseconds and return borrowed UTF-8
JSON fields. Bytes remain live until the next callback or context release. When a
release function is supplied, context ownership transfers on registration entry,
including rejected registration. Call/release must never unwind through Rust.
A host bridge stores a foreign exception, returns nonzero from the callback, then
rethrows after query returns status 5. Replaced contexts drop outside registry
borrows; active conversion retains its provider until completion.

Rust ABI tests cover phases, errors, exact values, context ownership and callback
reentry. `:c_abi_test` compiles a C++ client against both headers and links the
single SDK archive, with checks active in optimized builds.

Range calls retain one transition map across endpoint callbacks. Replacing timezone
data during conversion affects later calls; both endpoints keep the current call's
map. Calendar providers still resolve independently for each endpoint.

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
