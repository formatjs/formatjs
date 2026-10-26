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

The formatter, locale/timezone registries, optional calendars, ranges, C ABI,
Hermes facade and SDK installation remain unfinished.

```sh
bazel test -c opt //crates/intl_datetimeformat/...
```

Tests cover TimeClip endpoints, invalid numeric inputs, century rules, negative
nanoseconds and local offset crossings. Differential tests compare 8,193 instants
against the existing TS arithmetic across the full Date range.
