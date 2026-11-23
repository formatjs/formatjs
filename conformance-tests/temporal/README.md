# Temporal polyfill regressions

`polyfill-regressions.tsv` contains cases adapted from these pinned sources.

- The `duration-string`, `zoned-until`, and `zoned-since` rows come from
  FullCalendar's [rounding regressions](https://github.com/fullcalendar/temporal-polyfill/blob/cc7bffcc6c5d6b447210588630226ceef8e704e2/polyfill/src/classApi/basic/roundingRegressions.test.ts).
  The pinned [MIT notice](LICENSE-fullcalendar) applies to these adaptations.
- The `epoch-milliseconds` rows adapt the floor expectations from JS Temporal's
  [epochNsToMs tests](https://github.com/js-temporal/temporal-polyfill/blob/c55b211de913320d8aba32c456bb45914739f414/test/ecmascript.mjs).
  The `instant-parse` rows use fixed inputs adapted from its
  [valid string generator](https://github.com/js-temporal/temporal-polyfill/blob/c55b211de913320d8aba32c456bb45914739f414/test/validStrings.mjs).
  The pinned [ISC notice](LICENSE-js-temporal) applies to these adaptations.

Deduped against [Test262 at `2a1ade303f72`](https://github.com/tc39/test262/tree/2a1ade303f72d3de80565c921d685222405c32ce).
The London DST transition samples and the basic near-epoch zoned projections
already appear in Test262. The shared ICU rounding corpus already exercises
pre-epoch tie parity.

The FullCalendar skipped-day case expects a `RangeError` for the backward
one-hour difference across Pacific/Apia's collapsed rounding window. Node
26.5.1 returns `-P1DT1H`, matching both FormatJS implementations. The
[ECMA-262 preview's NudgeToZonedTime §22.15.5.14 step 8](https://tc39.es/ecma262/pr/3966/#sec-nudgetozonedtime)
asserts that this window has a nonzero span, so the upstream throw expectation
is omitted. [TC39 tracks a related collapsed calendar-unit window](https://github.com/tc39/proposal-temporal/issues/3310).

Run both consumers with:

```sh
bazel test -c opt //packages/temporal:polyfill_regressions_test //crates/temporal:temporal_test
```
