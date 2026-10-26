# formatjs_intl_datetimeformat

DateTimeFormat Rust port in progress. The current foundation provides TimeClip
and exact Gregorian civil fields from epoch nanoseconds. It handles astronomical
year zero, leap centuries, negative submilliseconds and timezone adjustments that
cross the Date range. No host Date/ICU is used.

`civil::time_clip` validates numeric Date inputs before truncating toward zero.
`CivilDateTime::from_epoch_nanoseconds` preserves submillisecond precision and
uses Euclidean division for negative instants. Months are 1–12; weekdays are
0–6 starting Sunday. `era_year` maps astronomical years to AD/BC display years.
Local arithmetic allows one extra day around TimeClip for offset conversion;
callers must validate the input instant before applying its timezone offset.

The formatter, optional calendar implementations, ranges, C ABI,
Hermes facade and SDK installation remain unfinished.

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
Optional built-in providers remain unfinished.

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
