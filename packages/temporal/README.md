# @formatjs/temporal

In-development Temporal implementation. Private until complete. Importing installs
no global; no native Temporal or reference-polyfill runtime fallback.

```ts
import {Temporal} from '@formatjs/temporal'

const value = Temporal.ZonedDateTime.from(
  '2020-03-07T12:00-05:00[America/New_York]'
)
value.add({days: 1}).toString()
// 2020-03-08T12:00:00-04:00[America/New_York]
value.add({hours: 24}).toString()
// 2020-03-08T13:00:00-04:00[America/New_York]
```

Eight partial classes: Instant, Duration, PlainTime, PlainDate, PlainDateTime,
PlainYearMonth, PlainMonthDay and ZonedDateTime. TS owns ISO/Hebrew arithmetic,
Gregorian fields and IANA timezone data, including future recurring rules.
Conversions share private slots. ZonedDateTime supports construction, parsing,
fields, offset matching, all disambiguation modes, updates, arithmetic, rounding,
day boundaries, differences, transition queries and serialization. Calendar days follow local time; hours follow
elapsed time. Alias spelling survives separately from primary-zone equality.

Missing: Now, remaining calendar
engines, Date/Intl integration and global
installation/detection. No implementation gap is an allowed conformance exclusion.

## Validation

All three engines/modes agree: Node, Hermes source and optimized bytecode. Strict
selections cover complete supported families. Full diagnostics remain failing.
Negative cases can pass incidentally when a method is missing; full aggregate
counts alone do not establish whole-method conformance.

| Class          | Strict executions | Full diagnostic passes/total |
| -------------- | ----------------: | ---------------------------: |
| Instant        |               346 |                      930/934 |
| Duration       |             1,072 |                  1,082/1,086 |
| PlainTime      |               234 |                      982/986 |
| PlainDate      |               364 |                  1,304/1,308 |
| PlainDateTime  |               518 |                  1,546/1,552 |
| PlainYearMonth |               348 |                  1,018/1,022 |
| PlainMonthDay  |               150 |                      394/398 |
| ZonedDateTime  |             1,390 |                  1,800/1,804 |

See [raw counts and failure areas](conformance-results.json). No new exclusions.
Hermes enables ES6 block scoping in compiler/runtime. The larger zoned and Duration Hermes
selections use a medium Bazel target timeout; per-case timeout stays 30 seconds.

```sh
bazel test -c opt //packages/temporal/... //crates/temporal:temporal_test
# Raw diagnostics, expected to fail until remaining behavior exists.
bazel test -c opt //packages/temporal:zoned_test262_full
bazel run -c opt //benchmarks/temporal:facade_benchmark
```

Independent ICU4J controls cover 25,269 Gregorian conversion samples, 2,349 Instant
rounding cases, 5,430 signed Duration rounding/totals, 7,740 clock-rounding cases,
840 date-arithmetic cases and 2,028 short-date cases. Zoned controls cover 13,160
offset/local-field samples and 1,340 future transitions, including gap/fold choices
and calendar-day versus 24-hour arithmetic. Both cores also match 10,528 ICU
next/previous queries and 19,440 independent calendar-span/decimal-rounding cases. Hebrew controls use the documented
bounded ICU range; forced full temporal-polyfill adds reference-date controls.

The dependency-free no_std Rust core supplies Instant, Duration, clock, ISO
plain/short-date and zoned foundations. Rust's TimeZone provider visits
all offsets; FixedOffset supplies constant zones. ICU transition records exercise
that boundary. TransitionZone borrows explicit IANA records and recurring footer rules; Rust
tests decode the owned JSON pack to exercise this provider. Production Rust
registry/alias loading, all-calendar zoned math and native
Hermes bindings remain pending. Gap resolution walks indexed transitions;
multiple nearby changes need no isolated-gap assumption. The measured WASM build covers earlier matched Instant/Duration
primitives; a complete WASM facade remains pending.

[Completion plan](../../knowledge-base/015-temporal.md).
[Benchmark methods, measurements and limits](../../benchmarks/temporal/README.md).

Duration now supports relative totals, comparison and rounding against plain dates
or zoned values. Calendar anchors use the existing ISO/Hebrew engines; clock
remainders retain exact nanoseconds. Week rounding preserves larger calendar
prefixes. Totals round exact rational results once to binary64. Native Rust adds
zoned total_duration, round_duration and compare_durations; native plain-relative
adapters remain pending.

The same ICU fixture now also checks 19,440 public Duration rounds and 6,480
relative totals in both cores. Real IANA controls add 1,340 independent relative
comparisons across future transitions. Forced full-polyfill Hebrew controls and
poisoned-array-iterator checks cover the facade paths. Duration's strict selection
now includes all 1,072 non-locale executions; full diagnostics still retain locale
failures. PlainDateTime also retains a helper requiring the unfinished Now API.
