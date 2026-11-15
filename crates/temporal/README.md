# formatjs_temporal

Allocation-free `no_std` Temporal core. Implementation in progress.
TypeScript package: [@formatjs/temporal](../../packages/temporal/README.md).

Core supplies Instant parsing, ISO conversion, all nine rounding modes, exact
Duration parsing/formatting/totals, clock arithmetic, calendar-aware plain
date/date-time, short-date and zoned types. Rational totals round once to binary64.

`ZonedDateTime<Z, C>` keeps an Instant with timezone and calendar providers. `FixedOffset`
supplies constant zones; `TransitionZone` borrows sorted explicit records plus
optional recurring TZif rules. Queries skip events changing only abbreviation or
DST metadata. Gap resolution walks transitions. Calendar-span rounding uses
actual anchors; week rounding preserves larger calendar prefixes.

Relative Duration adapters: `total_duration`, `round_duration` and
`compare_durations` on `ZonedDateTime`. Required endpoint/next-day bounds remain
checked. Production IANA
registry loading, native Hermes bindings and complete WASM facades remain
pending. The TS facade currently runs on Hermes; this core has no Hermes binding.

```sh
bazel test -c opt //crates/temporal:temporal_test
bazel build -c opt //crates/temporal:wasm
bazel test -c opt //benchmarks/temporal:wasm_test
bazel run -c opt //benchmarks/temporal:wasm_benchmark
```

Independent ICU4J controls cover 25,269 Gregorian conversions, 2,349 Instant
rounding cases, 5,430 signed Duration rounding/totals, 7,740 clock rounds,
840 date-arithmetic cases and 2,028 short-date cases. Tests decode the owned IANA
pack to verify real providers against 13,160 offset/local samples, 1,340 future
gap/fold controls and 10,528 strict transition queries. Zoned difference and
relative Duration tests share 19,440 calendar-span rounds, including 6,480 exact
relative totals. Relative comparisons reuse the 1,340 future-transition controls.
Separate cases cover range edges, adjacent gaps and recurring leap-only rules.

The measured WASM ABI covers matched Instant/Duration primitives, excluding
calendar/timezone data and the public object model. Pinned Hermes exposes no
`WebAssembly` in either source or bytecode mode. See
[benchmark scope and results](../../benchmarks/temporal/README.md#wasm-baseline)
and [completion plan](../../knowledge-base/015-temporal.md).

`Now<SystemClock>` accepts host epoch nanoseconds, clamps Instant bounds and
converts through an explicit TimeZone provider. It supplies instant, zoned ISO,
plain date/time, date and time views. Injected clock tests reuse all 13,160
independent ICU timezone samples, including sub-millisecond nanoseconds. This
host boundary does not install a system clock or discover a system zone itself.

`named_time_zone_identifier` looks up 597 case-insensitive IANA names without
allocation. `NamedTimeZone<Z>` attaches validated spelling/primary identity to a
provider; callers supply matching transition data. Equality uses primary ID,
independent of coincident offsets. Tests use real IANA providers and independently
check every ID and 178,503 pairs against ICU4J.

Regenerate the checked-in identity table after timezone/CLDR updates:

```sh
bazel run -c opt //crates/temporal:identifiers
```

Bazel derives this table from the generated TS timezone package. Runtime Rust
uses only the shared numeric calendar kernel; production transition-data loading stays pending.

PlainDate supplies ISO `total_duration`, `round_duration`, `compare_durations`
and calendar-unit `until`/`since`. PlainDateTime differences now accept
`DateTimeUnit` for years through nanoseconds; existing `TimeUnit` arguments still
work. `ZonedUnit` remains an alias. Plain and zoned operations share calendar
anchors and exact rounding while retaining separate range/offset rules.

Independent ICU controls add 51,840 plain rounds, 17,280 rational totals, 20,736
date differences and 4,224 comparisons, including BCE/year zero, leap/month ends
and years -270000/+275000. TS runs the same corpus on Node and Hermes source/
optimized bytecode. Native boundary cases also port pinned Test262 vectors for
zero durations at date limits, normalized overflow, week prefixes and rounding
beyond date limits. Clock carry validates the input endpoint before rounding;
the rounded duration need not fit an actual date. Native Hermes bindings remain pending.

```rust
use formatjs_temporal::{DateTimeUnit, Duration, PlainDate};
let anchor = PlainDate::new(2020, 1, 31).unwrap();
let month: Duration = "P1M".parse().unwrap();
assert_eq!(anchor.total_duration(month, DateTimeUnit::Day).unwrap(), 29.0);
```

`calendar` re-exports the shared 13-calendar numeric kernel from
`formatjs_intl_datetimeformat_calendars` with its default features disabled.
ISO conversion, PlainDate addition and calendar differences reuse it without
linking the formatter or serde. Numeric operations include signed years,
month codes, eras, inverse conversion and checked add/until. Public native
PlainDate/PlainDateTime/zoned types accept arithmetic engines or borrowed table
providers, including short-date types. Independent ICU controls validate 34,366 field
samples and 32,352 additions across all 13 engines. See
[calendar kernel and oracle limits](../intl_datetimeformat_calendars/README.md#numeric-calendar-kernel).

Calendar differences now compare unregulated month/day fields before clamping.
Shared plain/zoned rounding preserves the selected calendar quantum, then bubbles
only boundaries crossed by expansion. Independent ICU rounding/totals remain
unchanged. Pinned native Node 26.8.1 controls verify that Jan 31 to Feb 29 is P29D,
while month rounding gives P1M; older hand-written native expectations were fixed.
The numeric kernel also checks 32,352 independent ICU-derived differences.
Native plain date/date-time, short-date and zoned classes retain their calendar providers. Public TS classes expose all 16 calendars.

ICU month-end controls add 5,408 year/month total windows across 13 calendars,
checked through plain and UTC-zoned TS anchors. Native Rust checks all 416 ISO
windows. Total windows advance past constrained month ends before computing the
fraction; Jan 31 plus one month and ten hours uses the Feb 29–Mar 31 span.

ZonedDateTime supplies `start_of_day`, `hours_in_day` and `round` for day and
clock units. Day boundaries use the earliest midnight or first valid instant
when midnight is skipped. Day rounding handles repeated dates; clock rounding
prefers the original offset when valid. Independent ICU4J controls verify 5,292
boundary/rounding cases across historical gaps, folds and date-line changes.
Zoned month differences compare wall clocks before resolving calendar anchors,
avoiding a spurious whole month across Vancouver's spring gap.

## Calendar-aware public types

`PlainDate<C>`, `PlainDateTime<C>`, `PlainYearMonth<C>`, `PlainMonthDay<C>` and
`ZonedDateTime<Z, C>` retain a sealed,
copyable `CalendarProvider`. Default constructors use ISO. `with_calendar` accepts
any of the 13 arithmetic calendars or a validated borrowed `TableCalendar` for
Chinese, Dangi or Umm al-Qura. `CalendarRef` provides one enum for all 16 when
an embedding needs a single record type. Tables and their storage remain owned
by the caller; no runtime ICU or formatter dependency is added.

```rust
use formatjs_temporal::{calendar::Calendar, Duration, Overflow, PlainDate};
let start = PlainDate::new(2020, 2, 29).unwrap()
    .with_calendar(Calendar::Hebrew).unwrap();
let month: Duration = "P1M".parse().unwrap();
let next = start.checked_add(month, Overflow::Constrain).unwrap();
let fields = next.calendar_fields().unwrap();
```

`fields()` retains its ISO contract. `calendar_fields()` supplies year, ordinal
month, monthCode and day; `era()` and length getters use the chosen provider.
`DateFields` constructs dates from a year or era/eraYear plus month/monthCode and
day, checking year/era and month/monthCode consistency. `compare` orders ISO
coordinates; `equals` also checks calendar ID. Rust's `Ord` breaks equal ISO
coordinates by calendar ID to stay consistent with `Eq`.

Arithmetic, relative totals/rounding and differences use the chosen calendar.
Calendar mismatches reject differences, including clock-only datetime/zoned
requests. Clock rounding, date/time conversions, timezone transitions and day
boundaries preserve the provider. Display keeps ISO fields and appends the
calendar annotation at the end. Arithmetic calendar annotations parse directly;
`parse_in` accepts an explicit borrowed table provider and verifies the annotation.

`//crates/temporal:public_calendar_test` checks the public classes against the
existing arithmetic and table fixtures, retaining their ICU/HKO/KASI authority
policy. UTC-zoned checks require representable Instants; separate offset-zone
controls cover both public plain-date limits. This is native numerical coverage,
not a claim that Test262 runs against native Hermes bindings.

Short-date constructors retain ISO reference fields. `from_calendar_fields` and
`parse_in` canonicalize references using the selected calendar. YearMonth adds
and differences use calendar months/years, including leap months; all rounding
modes use actual calendar spans. Calendar month starts must satisfy PlainDate
bounds when arithmetic requires them, while stored YearMonth references use the
wider ISO year/month limits. Length getters return `Result` like PlainDate.

MonthDay chooses reference dates in 1900–1972, then 1973–2035, with the prescribed
Chinese/Dangi rare-leap-month constraints. `to_plain_date` retains monthCode across
years; `to_plain_date_fields` also accepts era/eraYear. Independent forward ICU
catalogs verify 4,992 MonthDay cases. Another 5,184 YearMonth cases check both
`until` and `since` across all nine rounding modes and 16 calendars. Existing
field/add/difference controls also exercise public YearMonth integration.
