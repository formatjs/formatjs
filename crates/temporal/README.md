# formatjs_temporal

Dependency-free, allocation-free `no_std` Temporal core. Implementation in progress.
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
checked. Native plain-relative adapters, remaining calendars, production IANA
registry/alias loading, native Hermes bindings and complete WASM facades remain
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
