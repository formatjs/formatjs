# Temporal implementation

Goal: complete Temporal in TypeScript and Rust, support Hermes, validate against
Test262 and independent ICU oracles, compare `temporal-polyfill`, measure WASM
versus TypeScript size and speed. Deliver incremental stacked PRs using `gh stack`.

## Current state

`packages/temporal` owns the TypeScript implementation and tests. Its workspace
name is `@formatjs/temporal`; it remains private while incomplete.
`benchmarks/temporal` owns comparisons and measurement records.

The public entry exports partial Instant, Duration, PlainTime, PlainDate, PlainDateTime, PlainYearMonth, PlainMonthDay and ZonedDateTime APIs. ISO/Hebrew arithmetic
and owned IANA timezone primitives are internal. `crates/temporal` now supplies a dependency-free `no_std` Rust instant, duration, clock, ISO date/date-time and short-date core. Native Hermes Temporal installation does not exist yet. Existing Intl Rust/Hermes infrastructure
is reusable; existing Temporal-based formatter calendars are not independent
Temporal implementations.

## Delivery order

1. Move runtime/tests into the package; preserve existing strict gates and
   independent ICU controls. Share timezone decoding below formatter packages.
2. Complete Instant parsing, serialization, comparison, arithmetic, rounding
   and differences; introduce shared duration/options machinery. Add the Rust
   instant/date/time core with identical boundary and oracle cases.
3. Implement Duration, PlainDate, PlainTime, PlainDateTime, PlainYearMonth,
   PlainMonthDay, ZonedDateTime and Now; Date/Intl integration and global
   installation/detection entries. Complete all specification calendars,
   calendar arithmetic and timezone identifier/transition semantics.
4. Expose Rust through the repository's Hermes JSI/C ABI model; retain JavaScript
   coercion, property access order, brands, descriptors and exception behavior
   in facades. Test source and optimized Hermes bytecode.
5. Build a WASM variant of the same Rust operations with JavaScript glue;
   compare equivalent public behavior, data and workloads before choosing any
   default backend.

Each step expands strict Test262 gates. Steps may split into smaller stacked PRs;
no completed slice establishes complete Temporal compliance.

## Completion criteria

- Complete pinned Temporal Test262 suite for TS and Hermes/native paths,
  including supported Date/Intl integration. Keep a raw strict diagnostic.
  Document every exclusion by upstream path, host limitation and rationale.
  Realm/host limitations may follow existing polyfill policy; missing methods,
  calendars or coercion semantics are implementation gaps, not exclusions.
- Rust core tests cover the same range, overflow, calendar, duration, rounding,
  timezone and ambiguity semantics as TS. Cross-language agreement alone is
  insufficient: use independently generated ICU expectations too.
- ICU calendar conversion/arithmetic and timezone transition/offset controls
  cover normal and extreme dates where ICU is reliable. Record versions,
  timezone differences and unsupported oracle ranges explicitly.
- Actual Hermes execution passes supported conformance in source and optimized
  bytecode modes. Check install order, repeated installation and native lifetime
  behavior using the existing Hermes integration infrastructure.
- Forced `temporal-polyfill` controls use matched API coverage, calendars,
  timezone policy and inputs; verify output equality before timing. Record
  engine/compiler/data versions, warmup and repeated batches.
- TS and WASM comparisons include raw/minified/compressed bytes, JS glue,
  owned calendar/timezone data, cold load/first use and steady-state timing.
  Separate code/data and shared/standalone profiles. Report native Hermes
  artifact size separately from WASM. Missing WASM support in a host is a host
  constraint, not a measured performance result.

## Existing evidence

Strict selections pass 346 Instant and 468 Duration executions on Node and
Hermes source/optimized bytecode. Full diagnostics remain failing: Instant
930/934, Duration 724/1086. Full eight-class counts and failure areas live in
packages/temporal/conformance-results.json. Calendar and integration behavior
remain implementation gaps, never exclusions.

ICU4J 79.1 independently checks 25,269 proleptic Gregorian samples across the
full instant range, 2,349 Instant rounding cases and 5,430 signed Duration
rounding/rational-total cases. Hebrew conversion uses the documented bounded
oracle range. Future timezone tests retain independent ICU transition controls.

Duration supplies branded TS records, exact ISO fractions, immutable field/sign
operations, time addition/subtraction, serialization and time-only totals and
comparison. Rust mirrors field validation/storage, parsing, signed rounding,
formatting, totals and arithmetic. Instant arithmetic/differences reuse these
cores. Totals round rational values once to binary64; unsafe numerator conversion
before division would lose precision. Calendar-relative Duration methods and
Duration.round remain incomplete.

Hermes compiler and runtime both enable ES6 block scoping. The compiler uses
`-Xes6-block-scoping`; without it, captured getter loop bindings differed in
bytecode. Native Rust Hermes installation, remaining classes/calendars, complete
Temporal conformance and complete WASM facade comparisons remain pending. An
initial matched primitive WASM baseline now exists; see below.

Parsing follows the [Temporal ISO grammar](https://tc39.es/proposal-temporal/#sec-temporal-iso8601grammar)
and [ParseISODateTime](https://tc39.es/proposal-temporal/#sec-temporal-parseisodatetime).
Test262 remains pinned in `MODULE.bazel`; review counts and diagnostics whenever
that pin or the selected surface changes.

## WASM baseline

`//crates/temporal:wasm` cross-compiles the dependency-free core through the pinned
Bazel Rust toolchain. A benchmark-only, allocation-free string ABI covers matched
Instant/Duration operations. Separate 256-byte buffers intentionally limit this
initial ABI; it is not the public Temporal object model or a full WASM backend.
The actual WASM artifact passes all 5,430 independent ICU signed rounding/total
cases, boundary/invalid-input checks and forced JS polyfill controls.

`//benchmarks/temporal:wasm_benchmark` measures TS primitives, WASM plus per-call
JS UTF-8 transfers, and forced `temporal-polyfill` 1.0.7. It records minified/gzip
JS, raw/gzip WASM, linear memory, cold module load/first operation from twelve
fresh children, and nine rotating steady-state batches per workload. Ordinary
and boundary inputs stay separate. No calendar/timezone data is included in
either owned primitive bundle. The reference has a broader API; full-polyfill
size or conformance cannot be inferred from these results.

`//benchmarks/temporal:hermes_wasm_probe` runs source and optimized bytecode on
the pinned Hermes overlay. Both report `WebAssembly` as undefined. No WASM timing
is claimed for Hermes; TS and native Rust installation remain required paths.
See [recorded measurements](../benchmarks/temporal/README.md#wasm-baseline).

## PlainTime

TS/Rust now provide clock fields, strict ISO time/date-time parsing, comparison,
wrapping add/subtract, signed differences, field-relative rounding and precision
serialization. Date duration fields are ignored after full duration validation.
`halfEven` parity is relative to the rounded field, not the full day's quotient;
for example, 01:06 rounded to 12 minutes yields 01:00. An independent ICU4J 79.1
decimal oracle validates 7,740 cases across all modes, ties, odd quotient counts,
parent fields and midnight. Shared TS/Rust vectors check grammar boundaries.

A complete construction/getter/add/subtract/toJSON/valueOf selection passes 234
executions on Node and Hermes source/optimized bytecode. Full upstream PlainTime
runs all 986 executions on each engine mode: 982 pass, 4 fail. Remaining
failures cover locale formatting. Full diagnostics stay failing;
missing behavior is not excluded. Public facades and native bindings for the
remaining classes are still required by the full goal.

## Date and date-time foundations

`plain-slots.ts` owns private records shared by the real PlainDate, PlainDateTime
and PlainTime classes. This enables branded conversions without invoking public
getters. `date-core.ts` owns field coercion, merge rules, calendar resolution,
metadata, arithmetic and relative difference/rounding calculations. Constructors
interpret ISO fields; property bags interpret calendar fields. Calendar annotation
identifiers are validated separately from calendar-like ISO strings.

TS uses existing ISO/Hebrew numeric arithmetic plus Gregorian field metadata.
Unimplemented calendar identifiers remain rejected; full calendar coverage is
still required. Rust now has checked ISO PlainDate/PlainDateTime values, parsing,
calendar-field addition, clock carry/differences, rounding and serialization.
Rust calendar-relative difference APIs and non-ISO date types remain pending.

Both cores independently match 840 ICU Gregorian arithmetic cases, including
leap/month ends, BCE, nanosecond carry and range bounds. Date metadata also matches
ICU weekdays, ordinals and ISO week/year. Strict complete-family selections pass
364 PlainDate and 518 PlainDateTime executions on Node/Hermes source/bytecode.
Full diagnostics remain failing: 1300/1308 and 1542/1552. Existing PlainTime
improves to 982/986 through real date-time conversions. No missing behavior is
allowed as an exclusion. Remaining month-day/year-month/zoned/Now classes, Intl
integration, all calendars, native Hermes installation and complete WASM facades
remain part of the active goal.

## Short-date classes

`plain-year-month.ts` and `plain-month-day.ts` provide real classes and private
calendar slots. Reference ISO fields are preserved for constructor/brand copies
and canonicalized for string/property-bag conversions. YearMonth includes months
that intersect the valid Date domain even when the reference first day is outside
that domain. `calendar.ts` now separates checked date conversions from internal
extended-range helpers; checked Date limits stay unchanged. Date differences use
extended calendar anchors so a temporary January outside the Date range does not
reject an otherwise valid month difference. Required YearMonth date endpoints
remain checked.

Both TS and Rust ISO cores cover parsing, validation, reference-field equality,
date conversion, year/month-only arithmetic and calendar-span rounding/differences.
TS retains owned Hebrew month-code arithmetic and canonical reference searches.
Other calendar engines and complete non-ISO conformance remain pending.

Independent ICU4J Gregorian/BigDecimal controls supply 2,028 cases: arithmetic,
month/year metadata, leap-day conversion, boundaries and signed nine-mode rounding
against actual calendar lengths. A forced full polyfill adds bounded Hebrew
reference-date controls; basic implementation remains the ISO timing reference.

Strict whole-family selections pass 348 YearMonth and 150 MonthDay executions
per Node/Hermes source/bytecode mode. Full diagnostics pass 1014/1022 and 394/398.
No missing zoned/Intl/relative Duration behavior is an allowed exclusion.
Normal package gates and raw diagnostics remain separate. The active goal still
requires complete ZonedDateTime, Now, remaining calendar engines, Intl/Date integration,
full Rust/native Hermes behavior and equivalent complete WASM measurements.

The real short-date conversions add 30 passing PlainDate executions, bringing
its full diagnostic to 1300/1308. All eight raw class reports agree across Node,
Hermes source and optimized bytecode; normal selections total 3,818 executions
per mode. All 52 normal package/Rust/WASM/shared-primitive checks pass. Full diagnostics
remain failing and separate from those gates.

## ZonedDateTime layer

The eighth TS class adds private zoned slots, owned named/fixed timezone lookup,
annotation/offset matching, construction, calendar and clock fields, arithmetic,
field replacement, rounding, day boundaries and conversions. PlainDate and
PlainDateTime expose zoned construction; Instant accepts zoned values and exposes
`toZonedDateTimeISO`. All conversions retain calendar/zone identity without
serializing intermediate objects. Internal Instant creation/validation avoids
calling mutable public static methods.

ZonedDateTime has 1,390 strict executions per engine mode. Full diagnostic is
1,796/1,804; relative Duration helpers and locale formatting stay
visible. The bytecode selection uses a medium Bazel target timeout for its larger
corpus; per-case timeout remains 30 seconds. No new exclusions.

Both language cores verify 13,160 ICU offset/local-field samples and 1,340 future
transition controls. Those transition controls check all disambiguation modes and
calendar-day versus elapsed-24-hour arithmetic. Rust's no_std `TimeZone` provider
interface visits all possible offsets; its ISO `ZonedDateTime<Z>` and `FixedOffset`
cores validate instant/local ranges independently. Rust production IANA loading,
all-calendar zoned math, Now, Date/Intl installation and native Hermes bindings
remain unfinished. Gap resolution now walks actual transitions.

## Zoned differences and indexed transitions

TS and Rust now supply zoned differences and strict next/previous offset queries.
Calendar rounding uses actual zoned endpoints, including DST and half-hour shifts;
clock rounding applies to elapsed remainders after calendar anchors. Internal ISO
anchors may lie outside PlainDate bounds while required public endpoints stay
checked. Date-only gaps use the first valid instant of the date, including skipped
dates, independently of the disambiguation option.

Transition lookup combines explicit records with recurring footer events. Extended
rule times include adjacent years; a 400-year Gregorian cycle bounds searches for
leap-only changes. Same-offset abbreviation/DST metadata changes are skipped.
Gap resolution walks all candidate events instead of assuming isolated changes.
Cold setup, unpacking, ISO validation and Duration serialization avoid observable
array iteration; a poisoned Array.prototype iterator guards these paths.

Rust's borrowed TransitionZone has no runtime dependencies/allocations. Test-only
JSON decoding loads the owned IANA pack into this provider. Both implementations
match 10,528 independent ICU next/previous queries and 19,440 ICU calendar-span /
BigDecimal rounding cases across all units, modes and signs. Real Rust IANA records
also match the original 13,160 offsets and 1,340 gap/fold controls. New synthetic
controls cover adjacent gaps and leap-only recurrences across 2100. Production
Rust registry/alias loading, calendars and native Hermes installation stay pending.

The Rust dependency page was restored from its last correct version; an earlier
Temporal layer had overwritten it with the Test262 page.
