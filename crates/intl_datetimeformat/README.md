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

The formatter, locale registry, optional calendars, ranges, C ABI,
Hermes facade and SDK installation remain unfinished.

```sh
bazel test -c opt //crates/intl_datetimeformat/... \
  //packages/intl-datetimeformat:rust_timezone_test
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
