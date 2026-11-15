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

Strict selections pass 346 Instant and 1,072 Duration executions on Node and
Hermes source/optimized bytecode. Full diagnostics remain failing: Instant
930/934, Duration 1082/1086. Full eight-class counts and failure areas live in
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
before division would lose precision. TS relative Duration total/round/compare now use shared plain/zoned arithmetic.
Rust exposes ISO plain/zoned relative adapters; remaining calendar engines and native bindings stay required.

Hermes compiler and runtime both enable ES6 block scoping. The compiler uses
`-Xes6-block-scoping`; without it, captured getter loop bindings differed in
bytecode. Native Rust Hermes installation, remaining calendars/integration, complete
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
Full diagnostics remain failing: 1304/1308 and 1548/1552. Existing PlainTime
improves to 982/986 through real date-time conversions. No missing behavior is
allowed as an exclusion. Remaining calendar engines, Intl/Date
integration, native Hermes installation and complete WASM facades
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
per Node/Hermes source/bytecode mode. Full diagnostics pass 1018/1022 and 394/398.
No missing zoned/Intl/relative Duration behavior is an allowed exclusion.
Normal package gates and raw diagnostics remain separate. The active goal still
requires complete ZonedDateTime, remaining calendar engines, Intl/Date integration,
full Rust/native Hermes behavior and equivalent complete WASM measurements.

The real short-date conversions add 30 passing PlainDate executions, bringing
its full diagnostic to 1304/1308. All eight raw class reports agree across Node,
Hermes source and optimized bytecode; normal selections total 4,986 executions
per mode. All 71 normal package/Rust/WASM checks pass. Four timezone data/ICU checks
and four shared packaging checks passed in the preceding layers. Full
diagnostics remain failing and separate from those gates.

## ZonedDateTime layer

The eighth TS class adds private zoned slots, owned named/fixed timezone lookup,
annotation/offset matching, construction, calendar and clock fields, arithmetic,
field replacement, rounding, day boundaries and conversions. PlainDate and
PlainDateTime expose zoned construction; Instant accepts zoned values and exposes
`toZonedDateTimeISO`. All conversions retain calendar/zone identity without
serializing intermediate objects. Internal Instant creation/validation avoids
calling mutable public static methods.

ZonedDateTime has 1,790 strict executions per engine mode. Full diagnostic is
1,800/1,804; locale formatting failures stay visible. The bytecode selection uses a medium Bazel target timeout for its larger
corpus; per-case timeout remains 30 seconds. No new exclusions.

Both language cores verify 13,160 ICU offset/local-field samples and 1,340 future
transition controls. Those transition controls check all disambiguation modes and
calendar-day versus elapsed-24-hour arithmetic. Rust's no_std `TimeZone` provider
interface visits all possible offsets; its ISO `ZonedDateTime<Z>` and `FixedOffset`
cores validate instant/local ranges independently. Rust production IANA loading,
all-calendar zoned math, Date/Intl installation and native Hermes bindings
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
Rust transition registry loading, calendars and native Hermes installation stay pending.

The Rust dependency page was restored from its last correct version; an earlier
Temporal layer had overwritten it with the Test262 page.

## Relative Duration arithmetic

TS Duration total/round/compare now prepare relative plain dates or zoned slots
with ordered field access. Internal adapters share calendar/zoned math; validated
records do not use reference Temporal. Blank values, range-limited intermediates,
normalization overflow and required next-day boundaries remain checked. Rounding
weeks retains year/month prefixes instead of rebalancing them into smaller days.
Rational totals combine integer and fractional components before one binary64
rounding. Negation/absolute value also avoid observable array iteration.

Rust's no_std ZonedDateTime adds total_duration, round_duration and
compare_durations, using the borrowed IANA provider and the same exact-rational
conversion. Remaining calendars and Hermes
bindings remain pending. ICU controls verify 19,440 relative rounds, 6,480 totals
and 1,340 transition-based comparisons. Bounded Hebrew controls use forced
full/implementation; the production runtime remains independent.

Duration's strict selection expands from 468 to all 1,072 non-locale executions
on Node/Hermes source/bytecode. All eight full reports agree; locale failures remain visible, not exclusions. Complete
Intl/Date integration, all calendars, native Hermes and full WASM equivalence
stay required by the goal.

Duration formatting was separated into a pure module. The matched WASM TS entry
now uses pure parse/format/total operations rather than Duration object machinery.
That is a new primitive measurement scope; full facade/data size remains separate.

## Now and host clock

TS implements all six Now methods through an internal SystemClock boundary.
Default TS clock captures Date.now (millisecond precision). Host Intl supplies
named system-zone discovery; hosts without DateTimeFormat use Date's current
system offset, never an inferred IANA location. Explicit zones continue to use
owned IANA data. Each call validates the zone before reading the clock; supplied
zones skip system-zone discovery. Captured constructors preserve intrinsic
results after public Now methods are replaced.

Rust adds no_std Now<SystemClock>, clamped wall-clock instants and ISO views
through existing TimeZone providers. Production Rust system-zone/clock discovery
and native Hermes installation remain pending. Injected clocks in both languages
match 13,160 independent ICU timezone samples, preserving sub-millisecond fields.
Clock-bound controls include negative epochs, Instant limits and detached methods.

All 138 upstream Now built-ins/intl402 executions pass on Node, Hermes source and optimized
bytecode. Separate real Hermes host tests exercise UTC, New York and Kathmandu.
No Realm or implementation exclusions added. See [Temporal.Now semantics](https://tc39.es/proposal-temporal/#sec-temporal.now)
and [SystemTimeZoneIdentifier](https://tc39.es/ecma262/#sec-systemtimezoneidentifier).

The pinned intl402/Temporal tree contains 2,040 files. This layer adds its three
Now files (six executions); the remaining 2,037 files are outside the current
class reports. Calendar/Intl compliance must cover that tree separately. Most
formatter calendar providers still call temporal-polyfill/fns and cannot be
used as independent Temporal implementations. Owned Chinese/Dangi/umm-al-Qura
conversion primitives/data can be extracted below the formatter layer.

The next integration slice also needs built-ins/Date/prototype/toTemporalInstant
(eight files), Temporal namespace/global installation and detection. Those paths
are not included in the per-class report totals.

## Installation and Date bridge

Public entries now include index, polyfill, polyfill-force and should-polyfill.
Only the two installation entries have package side effects. The root remains
pure. Conditional installation preserves a structurally available Temporal
namespace, repairing only a missing Date bridge. A repaired bridge captures its
Instant constructor. Forced installation sets the owned namespace and bridge;
repeat installation preserves the same owned identities. Explicit descriptors
reset enumerability even when replacing ordinary user-assigned properties.

Namespace detection and package detection differ: a missing Date method requests
loading the package, without replacing an otherwise available namespace. Presence
checks never certify calendar/Intl conformance. The package remains private.

The Date bridge calls captured intrinsic Date.getTime, then exact BigInt scaling.
It does not coerce the receiver or call public getters/factories. Invalid Dates
throw RangeError; proxies/fake Dates throw TypeError. This coercion/branding seam
can feed native Rust Instant creation later. The Rust millisecond constructor
and TS bridge match 25,265 independent ICU Gregorian samples. The four extended
local-date fixture samples outside Date/Instant range stay rejected.

The Test262 prelude imports the real force entry in every realm. Namespace roots,
Symbol.toStringTag and Date.prototype.toTemporalInstant add 26 strict executions
per Node/Hermes source/bytecode mode. Real bare-Hermes consumer tests execute the
conditional entry under UTC, New York and Kathmandu; pure root imports preserve
the absent globals on the pinned host. Unit controls preserve forced-reference
brands when repairing an existing namespace's missing Date bridge.

Complete intl402/Temporal diagnostics now execute all 2,040 files/4,080 scenarios
on Node and both Hermes modes. They stay manual and failing; baseline files pin
discovery counts with zero allowed failures. Hermes currently has no DateTimeFormat
prerequisite installed in this profile. That prerequisite and all calendar/locale
failures must be fixed or covered by a proper combined installation, never silently
excluded. Raw class diagnostics from the preceding layer remain separate records.

The separate size benchmark compares namespace, conditional installation, force
installation, detection and the forced reference. It reads bundles without executing
the installation entries. Prior throughput and primitive TS/WASM profiles retain
their declared scopes; adding an entrypoint does not justify rerunning every timed
workload. Full WASM facade/data and native Hermes measurements remain required.

Primary timezone identity now combines pinned IANA Zone records, zone.tab and
CLDR preferred IDs. Country primaries such as Accra/Abidjan remain distinct;
genuine aliases match. Named UTC roots are recognized separately from fixed offsets.
TS equality, calendar-unit difference guards and Now system IDs use this mapping.
Rust exposes allocation-free lookup and NamedTimeZone provider identity; production
transition-data loading remains pending. All 597 available names and 178,503
pairs match independent ICU4J expectations in both languages.

Bare Hermes still enumerates zero timezone IDs without DateTimeFormat installed.
Its canonical-pair Test262 case remains vacuous; independent ICU controls exercise
all identities regardless of that host list. Calendar helpers requiring
DateTimeFormat remain a separate host-integration gap.

The assembled npm package has an additional identity test. Independent bundles
of index and force installation originally created duplicate private brands.
Installation entries now import the published index through an explicit emitted
path mapping. Pure Date coercion lives separately from owned Instant creation,
so the installer cannot accidentally inline a second constructor/slot registry.
Tests load actual packaged JS, preserve a reference namespace on conditional
installation, then require force installation to share root constructors and the
named Date bridge. The new build option is opt-in; existing package defaults
retain their bundling behavior.

## Native plain-relative arithmetic

Rust PlainDate now exposes total_duration, round_duration, compare_durations and
calendar-unit until/since. PlainDateTime until/since accept DateTimeUnit for all
ten units, retaining existing TimeUnit calls. ZonedUnit remains an alias. Shared
calendar difference/relative rounding code uses separate plain/zoned anchors;
plain days stay exactly 24 hours and zoned days follow provider transitions.

Both cores reject clock carry outside valid plain-date bounds before relative
round/total. The prior TS non-calendar total fast path skipped that check. Range
checks apply to the input endpoint; Test262 permits rounded durations beyond the
date range. Zero durations preserve the existing early return at date limits.

A new independent ICU proleptic Gregorian oracle covers eight anchors, including
leap/month ends, BCE/year zero and years -270000/+275000. Node, Hermes source and
optimized bytecode share 51,840 plain rounds, 17,280 totals, 20,736 date differences
and 4,224 comparisons; Rust checks the same expectations. Native cases also port
pinned Test262 range/overflow/prefix vectors. These numerical ports do not replace
the required future native Hermes Test262 run. All-calendar Rust/TS support,
locale integration, native bindings and complete WASM facade/data remain open.

Shared Rust calendar differences use raw internal ISO coordinates when rounding
crosses public date limits. Public constructors still enforce their full ranges;
exact differences across both date limits match the forced reference for every
calendar largest unit. The large ICU Vitest case has a 30-second aggregate budget.

Current Node facade benchmarks retain 23 matched workloads against forced
Temporal reference. A separate nested pure Instant/Duration profile refreshes
TS/WASM/reference timings and cold loads after the ISO helper extraction.
Primitive TS is 3,757 gzip bytes; WASM plus bridge 20,132. This narrow profile
excludes the missing complete WASM facade/calendar/timezone data and does not
supply a Hermes backend.
