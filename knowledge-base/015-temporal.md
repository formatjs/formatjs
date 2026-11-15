# Temporal implementation

Goal: complete Temporal in TypeScript and Rust, support Hermes, validate against
Test262 and independent ICU oracles, compare `temporal-polyfill`, measure WASM
versus TypeScript size and speed. Deliver incremental stacked PRs using `gh stack`.

## Current state

`packages/temporal` owns the TypeScript implementation and tests. Its workspace
name is `@formatjs/temporal`; it remains private while incomplete.
`benchmarks/temporal` owns comparisons and measurement records.

The public entry exports Instant, Duration, PlainTime, PlainDate, PlainDateTime,
PlainYearMonth, PlainMonthDay, ZonedDateTime, Now and installation entries. Public
TS date classes use all 16 specification calendars and owned IANA timezone data.
Locale/Intl integration and some zoned edge semantics remain incomplete. `crates/temporal` supplies an allocation-free `no_std` core;
numeric calendar math is shared. Native date classes resolve all 16 calendars.
An experimental Hermes bridge delegates ISO conversion/day arithmetic to Rust;
remaining namespace operations still use TS. Complete native Hermes installation
and complete WASM facade/data remain pending.

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

`//crates/temporal:wasm` cross-compiles the no_std numeric core through the pinned
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

## Shared arithmetic calendar kernel

TS and Rust now supply 13 numeric engines: ISO, Gregorian, Buddhist, Japanese,
ROC, Coptic, Ethiopic, Amete Alem, Hebrew, Indian, civil/tabular Islamic and
Persian. Operations cover inverse epoch conversion, month codes, eras, checked
addition and differences. Native DateTimeFormat providers adapt the same Rust
kernel; Temporal uses its pure no_std feature without formatter, serde or tables.
Existing ISO/Hebrew TS differences and Rust ISO date math share these helpers.

Independent ICU controls exercise 34,366 field cases, 32,352 additions and 176
range rejections on Node, Hermes source/bytecode and Rust. Hebrew oracle range
stays ±1000000 epoch days; Persian controls stay within official years 1206–1498.
ICU forward field conversion plus boundary searches supply lengths/clamping,
avoiding negative Coptic/Ethiopic month-length and reverse Indian-setting bugs.
Full-range proleptic invariants cover all engines separately. No new Test262
exclusions. These numeric controls do not establish public calendar conformance.

The initial shared-kernel layer left public TS types at ISO/Gregorian/Hebrew;
public integration below expands them to 13 calendars. Native date classes still
use ISO. That layer left Chinese/Dangi/Umm al-Qura table engines for the integration below.
Native all-calendar object integration remains pending. Locale/Intl integration, native Hermes
bindings and complete WASM facade/data remain open. Size/performance measurements
must continue identifying the incomplete primitive WASM scope.

The shared-kernel layer refreshes `benchmarks/temporal/calendar-kernel-results.json`
with sequential facade and TS/WASM/reference primitive runs. Standalone namespace
is 86,815 gzip bytes, 529 above the prior layer; full numeric TS calendar module
is 3,126. Matched data-free TS primitives remain 3,757; WASM plus JS bridge is
20,024. These sizes retain separate scopes and exclude complete WASM facade/data.
Relative month totals measure TS 11,580 ns versus reference 8,700; rounding
17,814 versus 33,686. Native Hermes bindings remain required.

## Public arithmetic calendar integration

Public TS date, date-time, short-date and zoned classes now expose all 13 numeric
calendars. Constructors retain ISO positional fields; property bags use calendar
fields. Era/eraYear pairs resolve signed arithmetic years, reject contradictions
and normalize regnal dates leniently. Shared preparation preserves alphabetic
getter/coercion order and never reads era fields for ISO. Branded conversions use
private calendar slots, including ZonedDateTime to short dates.

ISODateToFields supplies monthCode without stale ordinal months. Shared merges
remove conflicting year/era groups and let MonthDay updates choose a fresh
reference year. Fixed 13-month calendars support M13 and six-day leap epagomenal
months; Islamic leap years use 355 days. Extended YearMonth era getters use raw
numeric coordinates.

Full Intl diagnostics exposed a false inverse-add assumption in the previous
calendar difference checks. Difference prefixes must compare unregulated days
and month codes before clamping. ICU controls now emit independent differences
using forward calendar fields and boundary walks: 32,352 samples across all 13
engines. Rust and TS share this behavior. Public controls additionally cover
34,366 fields, 32,352 additions, 176 bounds and 2,021 cross-class conversions on
Node and Hermes source/bytecode. Day-of-year/weekday controls now come from ICU.

Plain/zoned rounding shares a callback-based TS anchor and the existing Rust
RelativeAnchor. Rounding retains selected calendar quanta; only expansion can
bubble into larger units. It no longer loses selected units by re-differencing clamped endpoints. Native Node 26.8.1 confirms Jan31–Feb29 P29D versus month-rounded
P1M, plus P29DT45M for Jan31T23:30–Mar1T00:15. Three older hand-written native
expectations were corrected against that control.

Named arithmetic-calendar families add 2,344 strict Test262 executions per mode;
ISO remains covered by existing built-in families. Full Intl diagnostics remain
unfiltered and failing. Table support follows below; locale/Intl integration,
native non-ISO date classes, native Hermes bindings and complete WASM facade/data
remain required work. No conformance exclusions added.

ICU month-end controls add 5,408 year/month total windows across 13 calendars,
checked through plain and UTC-zoned TS anchors. Native Rust checks all 416 ISO
windows. Total windows advance past constrained month ends before computing the
fraction; Jan 31 plus one month and ten hours uses the Feb 29–Mar 31 span.

The 80-target Temporal/Rust/WASM validation passes. Strict Test262 gates total
7,330 executions per engine mode. Full Intl diagnostic remains failing at
3,118/4,080 on Node and 3,096/4,080 on Hermes source/bytecode; remaining failures
are implementation work, not accepted baselines.

Current public-calendar measurements live in
`benchmarks/temporal/public-calendar-results.json`. Standalone namespace is
87,709 gzip bytes (+894); forced reference is 19,393 using host Intl. Relative
month totals measure TS/reference 10,820/8,761 ns; rounding 12,894/34,131 ns.
Matched data-free primitives are 3,757 TS bytes versus 20,020 WASM plus bridge
(5.33 times TS). These primitive sizes exclude complete facade/calendar/timezone
data and native Hermes bindings.

## Table calendar integration

TS table calendars consume existing `@formatjs_generated/icu.calendar` packs
without formatter dependencies. Chinese/Dangi use year patterns and day/month
checkpoints every 64 years; Umm al-Qura uses year starts and packed month lengths,
with civil fallback outside its official range. Lunisolar generation includes
whole years covering internal rounding coordinates through ±110000000 epoch days.
No locale patterns change.

`crates/intl_datetimeformat_calendars::table_calendar` exposes validated borrowed
views of those packs, without allocation, serde or embedded data in the numeric
core. Arithmetic and table calendars share private `NumericCalendar` addition and
difference algorithms. Callers own table storage; native Temporal date classes
still need non-ISO object integration and Hermes bindings.

Chinese/Dangi skip era fields, constrain absent leap months backward, and follow
the normative MonthDay reference ranges and rare-leap-month restrictions.
Calendar construction, metadata and arithmetic remain synchronous.

Table controls combine 15,932 fields, 6,720 additions, 6,720 differences, 937
cross-class samples and 1,248 relative-total windows. Node and Hermes run public
classes; Rust checks numeric tables. Separate public/native controls compare all
2,474 published HKO month starts. Complete Chinese years 1901–2099 use HKO fields;
ICU4J supplies edge years, Dangi and Umm al-Qura. KASI supplies the February 2017
Dangi boundary where ICU79 is a day late. Runtime ICU4X data already matches KASI.

The raw ICU diagnostic remains unfiltered and failing. Its disagreements with
published HKO/KASI data are oracle limitations, not runtime expectations or
Test262 exclusions. Reproducible source hashes and a Bazel regeneration command
live in `conformance-tests/calendar-authorities/README.md`.

Hermes Test262 now loads the implementation separately before each case. Bytecode
mode compiles the implementation once per suite, then executes it in a fresh
runtime alongside each separately compiled case. Both implementation and test
execute bytecode; case/suite timeouts remain unchanged. This avoids recompiling
full calendar packs for every case. Source mode also loads separate scripts.

The table-calendar layer records 26 matched facade workloads in
`benchmarks/temporal/table-calendar-results.json`. Standalone namespace is
358,888 gzip bytes, including full-range owned calendar and IANA packs;
forced reference is 23,226, relying on host Intl. Matched data-free TS
primitives remain 3,757; WASM plus bridge is 20,020. Complete facade/data
WASM equivalence and native Hermes bindings remain pending.

Current facade measurements force `temporal-polyfill/full/implementation`. Earlier
19,393-byte reference reports used its basic ISO/Gregorian entry; historical
reports now identify that scope explicitly. Size profiles retain both builds.

Validation for the table layer passes 89 targeted tests across Temporal, Rust,
Hermes, WASM and shared formatter paths. Strict Test262 gates execute 7,960 cases
per engine mode. Full Intl diagnostics remain failing: Node 3,884/4,080; Hermes
source/bytecode 3,862/4,080. Locale/offset/zoned failures remain required work.

## Historical zoned edges

String offsets retain precision: minute-only syntax may match a rounded historical
zone offset; explicit seconds/fractions require exact matching. Property bags
always require exact matches. TS zoned differences and the shared Rust anchor
engine compare local clocks before selecting calendar months across DST gaps.

Day rounding caps the input below the next earliest civil midnight. This follows
[TC39's repeated-date fix](https://github.com/tc39/proposal-temporal/issues/3312),
including Casey's repeated 2010-03-04. Rust exposes `start_of_day`, `hours_in_day`
and `round` for day/clock units; clock rounding prefers the original offset.
A separate ICU4J generator supplies 5,292 boundary/rounding cases for TS/Rust,
covering half-hour DST, midnight gaps/folds, skipped and repeated dates.

A strict Intl timezone-edge gate adds 22 Test262 executions per engine mode.
The aggregate strict gate now covers 7,982 executions on Node, Hermes source
and Hermes optimized bytecode. Full Intl diagnostics still run unfiltered.

`ZonedDateTime/links.js` assumes `CST6CDT` aliases Chicago. TZDB 2026d restored
four POSIX IDs as separate Zones; pinned IANA 2026f and ICU79 agree. Current
[ECMA-402 primary-ID rules](https://tc39.es/ecma402/#sec-use-of-iana-time-zone-database)
require Zones to remain primary. TG2 agreed to retain alias behavior on
2026-10-08, but the normative change remains pending in
[ECMA-402 #1103](https://github.com/tc39/ecma402/issues/1103).
Keep this data-version/spec-policy diagnostic visible; no Test262 exclusion or
silent override of the independently checked primary mapping.

This layer passes 87 Temporal/Rust/Hermes/WASM regression targets. Refreshed full
Intl diagnostics pass 3,906/4,080 on Node and 3,884/4,080 on Hermes source/bytecode;
remaining failures stay required work. Native public calendar classes, native
Hermes bindings and complete WASM facade/data remain pending.

Fresh measurements live in `benchmarks/temporal/zoned-edge-results.json`:
26 full-reference facade workloads plus matched data-free TS/WASM primitives.
Namespace size is 358,928 gzip bytes (+40); the host-Intl full reference is
23,226. Matched primitives remain 3,757 TS bytes versus 20,020 WASM plus bridge.
Zoned day differences measure TS/reference 12,962/51,032 ns. Full WASM facade/data
and native Hermes backend measurements remain pending.

## Locale methods

All eight prototypes have intrinsic `toLocaleString` methods. Date/time methods
pass private records to the owned DateTimeFormat locale bridge; Duration passes
private field copies to DurationFormat. No native Temporal fallback. Formatter
intrinsics refresh during installation so Intl polyfills may be installed first
or followed by a Temporal installation. The namespace and global install entries
continue to share brands.

The owned path passes 306 strict locale/enumeration Test262 executions per
Node/Hermes mode. The gate includes distinct enumerated timezone primaries.
Candidates use the shared IANA/CLDR primary table; DateTimeFormat alias
preservation cannot determine which identifiers are primary.
The sole data-version exclusion is
`ZonedDateTime/prototype/toLocaleString/offset-time-zones.js`: pinned Test262 expects
bare GMT at zero, whereas [CLDR49](https://www.unicode.org/reports/tr35/49/tr35-dates.html#Time_Zone_Names)
and ICU79 require explicit numeric zero. Unfiltered Intl diagnostics retain the
file. Separate owned regressions verify zero, positive, negative and half-hour
fixed offsets. No implementation failure is added to an accepted-failure baseline.

Independent ICU4J controls cover 768 locale style/skeleton/offset cases in
TypeScript and Rust across
English, German, French and Japanese. Numeric-offset controls use ICU's requested
component widths and locale timezone-append pattern; best-fit punctuation is not
assumed to match a different skeleton request. Historical metazone name data is
unavailable in ICU before 1970, so the formatter uses numeric names then, preserving
invariant UTC names. Historical positive and negative offset seconds are retained.

Legacy native-Intl diagnostics now pass 4,020/4,080. Direct native DateTimeFormat
brand interop, YearMonth/MonthDay style filtering and native Date clipping of
extended plain values remain required work. Owned full Intl diagnostics passed
4,076/4,080 per mode after the enumeration fix. The four failures reflect
pinned timezone/CLDR assumptions; all raw reports stay unfiltered. Native calendar classes, native
Hermes bindings and complete WASM facade/data remain open.

Fresh locale benchmarks live in `benchmarks/temporal/locale-results.json`.
The namespace is 360,277 gzip bytes; adding owned DateTimeFormat with English
data, all calendars/timezones and DurationFormat gives 434,819 bytes. The full
reference is 23,226 bytes plus host Intl. Date/time locale methods take
330–1,545 µs versus reference 45–68 µs; Duration takes 29 versus 71 µs. All
workloads check exact output equality. Globals are restored before timing so
the reference uses host Intl and owned methods retain captured intrinsics.
Complete WASM facade/data remains unmeasured.

## Native calendar providers

Rust public PlainDate/PlainDateTime/ZonedDateTime now carry sealed calendar
providers. The default arithmetic enum retains ISO construction; borrowed table
providers and CalendarRef cover all 16 calendars without allocation or a formatter
dependency. Existing ISO field access remains explicit; calendar fields, eras,
lengths and typed field construction use the provider. Display and parser retain
calendar annotations.

RelativeAnchor now supplies its calendar to shared difference/round/total logic.
Date/time conversions, clock rounding, zoned day boundaries and transition queries
retain the provider. Differences reject calendar mismatches for every unit.
Production registry loading, string-zoned facades, native Hermes bindings and
full WASM facade/data remain pending.
Independent public-facade controls pass 50,298 field rows, 39,072 additions,
39,072 differences, 6,656 relative windows and 176 range rejections, across all
16 providers. Arithmetic rows use ICU; table rows retain published HKO/KASI
corrections. UTC-zoned rows need representable Instants; separate fixed-zone
checks cover both public plain-date limits. Zero-duration operations remain
valid at those bounds. Native Rust and matched WASM primitive tests pass; full
WASM facade/data and native Hermes conformance remain unproven.

The matching size refresh is `benchmarks/temporal/native-calendar-size-results.json`:
3,757 gzip TS primitive bytes versus 20,015 WASM plus bridge; namespace 360,277.
This measures the existing data-free ABI, not the new calendar-aware public Rust
facades or their data. Complete WASM facade measurement remains pending.

## Native calendar short dates

PlainYearMonth/PlainMonthDay now retain CalendarProvider values too. Existing
constructors and fields() keep ISO reference semantics; typed bags and strings
canonicalize references in the chosen calendar. YearMonth length getters now
return Result consistently with PlainDate. Addition, difference and all nine
rounding modes use the shared calendar math, including 13-month years.
Differences reject calendar mismatches before coordinate equality.

Explicit bounded extended conversion/add/era methods in the shared numeric
kernel support reference dates beyond PlainDate limits without weakening public
date validation. YearMonth add/difference still validate required calendar month
starts. MonthDay uses 1900–1972 then 1973–2035 reference windows, plus prescribed
Chinese/Dangi rare-leap-month constraints. Year conversion preserves monthCode;
era/eraYear input is supported separately.

The new ICU4J forward-month catalog checks 4,992 MonthDay cases; 5,184 independent
YearMonth rounding cases check until/since, nine modes, increments 1/2/5 and both
directions across 16 calendars. The generator reuses existing ICU forward-field
math and HKO/KASI authority corrections. Existing public field/add/difference
fixtures now exercise YearMonth integration too. Native Hermes Test262 and full
WASM facade/data measurements remain pending; this layer adds no WASM exports.

## Native IANA registry

TimeZoneRegistry borrows validated, sorted TimeZoneRecord values. ResolvedTimeZone
supplies exact offsets, every represented offset and strict transitions through
the existing provider. It retains canonical identifier spelling and primary IANA
identity; comparisons never substitute offset equivalence for zone identity.
Minute offset strings normalize separately, including negative zero. Empty
registries still supply UTC aliases and fixed offsets. Unknown identifiers,
missing recognized-zone data and invalid record data have separate errors.

`//crates/temporal:with_time_zones` enables `compiled_time_zones`. Its generator
reads the pinned generated TS pack, emits 448 primary records to Bazel outputs,
and retains structured future rules. UTC is intrinsic. Checked const constructors
validate offsets, sorted transition times, public instant bounds and rule fields.
The default core and primitive WASM build remain data-free; runtime loading uses
caller-owned typed records, without JSON/serde/formatter dependencies.

Existing native offset, disambiguation, Now, transition, identity, relative/zoned
and day-rounding suites now use the production registry. Native checks expand
from primary-only data to all 597 recognized IANA identities: 17,640 future
samples, 1,900 gap/fold controls, 14,058 strict transition query instants (both
directions and adjacent nanoseconds), plus 178,503 identity pairs. The ICU
superset also contains legacy short IDs such as ACT; tests require those to
reject when absent from the pinned IANA identifier table. Missing data for any
recognized name fails. Record coverage equals the independent ICU identity
profile's complete primary set.

Native zoned string parsing/formatting, Hermes C ABI/JSI installation and native
Test262 remain required. No WASM export or full-facade size/performance claim is
added by this registry layer.

## Native zoned strings

Rust ZonedDateTime now parses required zone annotations through TimeZoneRegistry.
`parse` selects arithmetic calendars; `parse_in` takes an explicit provider for
all 16, including borrowed table engines. `FromStr` uses the optional compiled
registry with the default arithmetic calendar type. Basic/extended ISO syntax,
critical/unknown annotations, calendar aliases and first-calendar handling reuse
the shared grammar. Strings retain ISO coordinates independently of the calendar.

`from_local_with_offset` separates UTC Z, wall time, exact offsets and
minute-precision string offsets. Reject/prefer/use/ignore policies preserve
historical second matching and disambiguation rules. Prefer/reject check the local
UTC-day range; use/ignore can accept lower-limit local fields whose offset-adjusted
instant is valid. Date-only strings use start-of-day even when reject is selected.
These controls follow InterpretISODateTimeOffset and pinned Test262 limit vectors.

Display/format on resolved zones support precision, all rounding modes, offset
visibility, zone-name critical/visibility and calendar annotation options. Round
the instant first, then query its offset; crossing gaps/folds cannot reuse the old
offset. ISO date/time and offset-minute formatting reuse existing primitives.

A new ICU4J/java.time oracle supplies 23,610 recognized-IANA string rows, adding
1850/1900/1945/1970/2000 January/July histories to existing post-2100 samples.
5,940 ICU/BigDecimal rows cover all nine modes, minute/digits0..9, both signs,
transition crossings, exact instant limits and annotation policies. No recognized
IANA rows are excluded. ICU-only legacy IDs must reject. Typed calendar tests check
all 16 providers through UTC parse/format, without requiring the compiled zone pack.
Native Test262-derived vectors cover syntactic offset matching, extreme bounds,
fold/gap choices and date-only skipped dates. These are numerical/string controls;
native Hermes Test262 and full WASM facade/data measurements remain required.

The shared offset formatter's primitive size refresh is
`benchmarks/temporal/zoned-string-size-results.json`: WASM raw 43,568/gzip 19,531,
bridge 463 gzip bytes, matched TS 3,757. Namespace TS remains 360,277 gzip.
This remains a data-free primitive ABI measurement, excluding the new zoned facade
and compiled calendar/timezone packs. Full backend size/performance remains open.

## Compiled calendars and native context

CalendarRegistry keeps the 13 arithmetic engines plus optional validated borrowed
Chinese/Dangi/Umm al-Qura providers. IDs are case-insensitive; islamicc and
ethiopic-amete-alem normalize. Duplicate table providers, unknown IDs and missing
recognized-table data have explicit errors. Provider iteration retains data
lifetimes independently of the temporary construction list.

The `compiled_calendars` feature / `with_calendars` Bazel target generates static
Rust descriptors from the pinned ICU calendar package. Existing checked table
constructors validate packs once at registry creation; no unchecked provider
constructor is added. Retain the resulting registry/context. The `compiled_data`
feature / `with_compiled_data` target combines calendar and timezone packs. Default
core and existing primitive WASM targets include neither pack.

TemporalContext owns copyable registry views. Its string factories return date,
date-time, year-month, month-day and zoned values with CalendarRef providers,
selecting all 16 calendars from annotations. This closes the default arithmetic
type's table-calendar selection gap for native namespace entry points. Returned
values retain their data views after the context itself is dropped, while the
underlying caller-owned storage must remain alive.

Public native calendar tests now resolve all providers through production registry
lookup, replacing duplicated JSON loaders and removing serde_json from that test
target. All 50,298 independent field rows additionally verify context parsing;
39,072 additions/differences, 6,656 relative windows and the 10,176 short-date cases
retain their full scope and ICU/HKO/KASI authority policy. Separate context tests
cover every date class across all 16 calendars, aliases, leap-month constrain/reject,
borrowed-data lifetimes and both public plain-date limits.

Native Hermes C ABI/JSI installation and native Test262 are now the next required
implementation work. No native JS backend or full WASM facade has been installed
by these typed data/context changes. Full-backend benchmark/size proof remains open.

## Experimental Hermes Rust ISO bridge

The `ffi` feature (`//crates/temporal:with_ffi`) exposes normalized JSON requests
for ISO fields/epoch conversion and day arithmetic. The unified Hermes Rust
archive reexports the ABI through a Bazel-only crate root; the published Cargo
archive has no dependency on the private Temporal crate. C++ owns and frees each
response. Without this feature, the default Rust core remains data-free,
allocation-free and `no_std`.

`FORMATJS_TEMPORAL_RUST_ISO=1` enables a runner-only callback. The experimental
payload captures/removes it, configures the private ISO backend, then installs
the public Temporal namespace. Those three operations require Rust; errors never
fall back to TS. Coercion, slots, descriptors and remaining operations still use
TS. This is a partial backend, not complete native Temporal or SDK installation.

`native_iso_hermes_oracle_test` verifies 25,265 independent ICU proleptic Gregorian
rows through public classes in Hermes source and optimized bytecode. Rust ABI
checks additionally cover the oracle's extended plain-date bounds, malformed
requests, error ownership and fractional day arithmetic. The native ISO Test262
targets pass 7,982 executions per mode with strict per-family baselines.
This proves the hybrid configuration only. Complete Rust/WASM backends and equivalent full-backend
performance/size comparisons remain required.

## Native Instant operations on Hermes

The experimental backend now delegates Instant parsing, formatting, add/subtract,
rounding and until/since to Rust. Shared JS code retains coercion, property access
order, slots, brands and numeric projections/comparisons. The private interface
is now `native.ts` / `configureNativeTemporal`; runner flag and existing ISO
profile target names remain compatible. Other Temporal algorithms and locale
integration still require native work.

The full pinned Instant Test262 selection has 934 executions per Hermes mode;
the wider strict native profile covers 8,570 per mode. Independent public-class
controls add parsing/formatting across 25,265 ICU Gregorian rows, 2,349 BigDecimal
rounding cases and 3,168 signed difference cases (both until and since). Signed
controls use valid Instant endpoint spans and time units; day rounding is outside
Instant's difference API. ABI validation rejects malformed options and durations.

`//benchmarks/temporal:hermes_instant_benchmark` compares public Instant operations
with TS and `temporal-polyfill` 1.0.7 in Hermes source and optimized bytecode.
Recorded bytecode parsing takes about 3.17 microseconds with Rust versus 9.00 TS;
formatting 6.70 versus 8.88. The JSON bridge makes add and round slower than TS;
until is close. These hot-operation samples do not measure full native Temporal,
startup, full WASM or full backend size. Backend selection remains open.

Invalid UTF-16 Instant strings retain `RangeError`: escaped code units are
rejected before JSON-to-UTF-8 decoding. Source/bytecode regressions cover lone
surrogates, captured intrinsics and mandatory native calls for every new operation.
