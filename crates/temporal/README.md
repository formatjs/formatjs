# formatjs_temporal

Allocation-free `no_std` Temporal core. Implementation in progress.
TypeScript package: [@formatjs/temporal](../../packages/temporal/README.md).

Core supplies Instant parsing, ISO conversion, all nine rounding modes, exact
Duration parsing/formatting/totals, clock arithmetic, ISO plain/short-date types
and provider-based zoned arithmetic. Rational totals round once to binary64.

`ZonedDateTime<Z>` keeps an Instant with a `TimeZone` provider. `FixedOffset`
supplies constant zones; `TransitionZone` borrows sorted explicit records plus
optional recurring TZif rules. Queries skip events changing only abbreviation or
DST metadata. Gap resolution walks transitions. Calendar-span rounding uses
actual anchors; week rounding preserves larger calendar prefixes.

Relative Duration adapters: `total_duration`, `round_duration` and
`compare_durations` on `ZonedDateTime`. Required endpoint/next-day bounds remain
checked. Remaining calendars, production IANA
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
the rounded duration need not fit an actual date. Native non-ISO calendars and
Hermes bindings remain pending.

```rust
use formatjs_temporal::{DateTimeUnit, Duration, PlainDate};
let anchor = PlainDate::new(2020, 1, 31).unwrap();
let month: Duration = "P1M".parse().unwrap();
assert_eq!(anchor.total_duration(month, DateTimeUnit::Day).unwrap(), 29.0);
```

`calendar` re-exports the shared 13-calendar numeric kernel from
`formatjs_intl_datetimeformat_calendars` with its default features disabled.
ISO conversion, PlainDate addition and calendar differences reuse it without
linking the formatter, serde or tables. Numeric operations include signed years,
month codes, eras, inverse conversion and checked add/until. Public native
PlainDate/PlainDateTime/short-date/zoned types still use ISO; all-calendar object
integration remains pending. Independent ICU controls validate 34,366 field
samples and 32,352 additions across all 13 engines. See
[calendar kernel and oracle limits](../intl_datetimeformat_calendars/README.md#numeric-calendar-kernel).
