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

Missing: remaining calendar
engines, locale/Intl integration and native Rust bindings. No implementation gap is an allowed conformance exclusion.

## Validation

All three engines/modes agree: Node, Hermes source and optimized bytecode. Strict
selections cover complete supported families. Full diagnostics remain failing.
Negative cases can pass incidentally when a method is missing; full aggregate
counts alone do not establish whole-method conformance.

| API            | Strict executions | Full diagnostic passes/total |
| -------------- | ----------------: | ---------------------------: |
| Instant        |               346 |                      930/934 |
| Duration       |             1,072 |                  1,082/1,086 |
| PlainTime      |               234 |                      982/986 |
| PlainDate      |               364 |                  1,304/1,308 |
| PlainDateTime  |               518 |                  1,548/1,552 |
| PlainYearMonth |               348 |                  1,018/1,022 |
| PlainMonthDay  |               150 |                      394/398 |
| ZonedDateTime  |             1,390 |                  1,800/1,804 |
| Now            |               138 |                      138/138 |

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
failures. Now also supplies the PlainDateTime helper needed by the full non-locale corpus.

## Host clock

`Temporal.Now` exposes instant, zoned/date/time ISO views and the system zone.
Host clock precision is milliseconds in TS. Clock values clamp to Instant bounds;
explicit zone validation precedes the clock read. Conversion uses owned IANA
rules and intrinsic constructors, independent of mutable public Now methods.

Named system zones come from captured host Intl.DateTimeFormat. Hermes without
Intl uses Date's current system offset; it does not guess an IANA location from
that offset. Source and optimized-bytecode host checks run under UTC,
America/New_York and Asia/Kathmandu. The complete Now Test262 built-ins and intl402 corpora have 138
executions per mode, with no exclusions. TS and Rust injected clocks also match
13,160 independent ICU future-offset/local-field samples.

Rust's no_std `Now<SystemClock>` accepts a host wall clock and TimeZone provider.
Native system-clock/timezone installation remains part of the pending binding.

## Installation

```ts
import '@formatjs/temporal/polyfill.js'

new Date(0).toTemporalInstant().epochNanoseconds // 0n
```

`polyfill.js` installs an absent/incomplete namespace and repairs a missing Date
bridge. Existing namespace/bridge functions survive conditional installation.
A repaired bridge constructs that namespace's Instant, preserving its brands.
`polyfill-force.js` installs the owned namespace and Date bridge together.
Both entries share the published index and set standard non-enumerable descriptors. The root import stays pure;
it also exports the owned `toTemporalInstant` method for explicit use.

```ts
import {shouldPolyfill} from '@formatjs/temporal/should-polyfill.js'
if (shouldPolyfill()) await import('@formatjs/temporal/polyfill.js')
```

Detection checks constructor/Now presence and the Date method; it is not a
conformance certificate. The package remains private while implementation gaps
remain. Tests always force the owned implementation, even on Node with native
Temporal. TypeScript builds use the repository's ESNext Temporal standard lib.

Installation's 26 Test262 executions pass on Node and Hermes source/bytecode.
Bare Hermes also runs the conditional entry under three system zones. Separate
pure-entry checks protect globals. TS and Rust Date paths match 25,265 independent
ICU Gregorian samples; four fixture dates outside Date's range remain rejected.

The new complete intl402/Temporal diagnostic covers 2,040 files separately from
built-ins class reports. Calendar/locale failures remain visible; no new exclusions.
See conformance-results.json for engine-specific counts and missing prerequisites.
