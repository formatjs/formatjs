# Temporal implementation

Current delivery scope: pure TypeScript, native Rust and native Hermes bindings.
Temporal WASM runtime entries, assets, build targets and test variants are removed.
WASM measurements and ABI notes below are historical. New native Rust/TS comparison:
`bazel run -c opt //benchmarks/temporal:native_ts_benchmark`. It checks matched
outputs and reports per-workload samples; native timings exclude binding costs.

## Specification audit

The [line audit ledger](audits/temporal-spec-audit.md) pins the Temporal specification
and tracks reviewed lines separately from open clauses and pending PRs.
`ParseMonthCode` field preparation now rejects bare `M00` before reading later
fields. Trailing terminators remain invalid. Calendar-specific validity stays deferred.
Duration `relativeTo` conversion recognizes PlainDateTime internal slots and copies
only the ISO date and calendar, without observing shadowed public getters.
TS and Rust calendar-unit totals validate both interpolation endpoints before
returning exact results. Zero zoned calendar totals use the positive window;
plain zero totals retain their specified shortcut.
Short-date string conversion reads `overflow` after syntax/calendar validation,
before representable-range checks and calendar projection, on both JS backends.

## Native performance direction

Goal: native Rust faster than TS; pure TS faster than both references across
matched public workloads, preserving spec behavior and preventing regressions.

Matched workload target reached: native Rust wins all 37 cases in six fresh
runs, preserving the original 25 plus 7/3/2 named-zone groups. TS wins all 48
medians and means against `@js-temporal/polyfill` 0.5.1. Against `temporal-polyfill`
1.0.7 basic, original full-48 results win 47 medians and all 48 means;
`dateFromFields` retains a 1.90% slower median and 5.35% faster mean. Six longer
controls retain its original predecessor order and shared callsite: TS wins by
15.2% median and 14.7% mean. This supplements the original slower point.

Six original full-48 before/after controls pass 47 rows at the 3% median/mean
regression screen. DateTime parsing retains +3.31% median and -0.25% mean;
six longer causal-prefix controls give +0.46% median and +0.55% mean, within the
screen. Parser algorithms are AST-identical. This supports the practical screen;
it does not claim exactly zero cost or replace the original full-suite result.

Clean committed source passes all 71 Rust/Node/Test262/ICU/Hermes gates, with no
new exclusions. Consumer: 146,826 minified / 41,604 gzip bytes (+486 gzip versus
regression baseline; basic 19,367, official 47,066). Nine fresh processes/profile
measure import plus first operation at 21.8 ms TS, 39.6 ms basic and 29.4 ms
official, excluding launch. TS first operation alone remains slower than official.

Raw full-suite comparison retains three TS, three basic and two official
processes, all 48 cases/eight inputs with parity and consumed outputs. Worst TS
process beats best official process on every median and mean. Host restart lost
the third official process and temporary controls; it is not counted. Regenerated
native/prefix controls and clean validation stay separate from earlier full-suite
and startup data. These are hot matched-workload results on Node/V8 and native
Rust, excluding binding costs; no universal API, engine or platform speed claim.
See [day-start evidence](../benchmarks/temporal/day-start-experiments.json) for samples, profiles, sources and recovery notes.

Rust Gregorian inverse conversion now uses 4,568 readonly bytes for 128-day
blocks. Six fresh comparisons win all 37 Rust/TS medians and means, including
three long-offset controls; original 25/7/3/2 groups stay separate. All 71
Rust/Node/Test262/ICU/Hermes gates pass. Scattered 8,192-date controls improve
~12%; first call adds ~60 ns, probe process time unchanged within noise. No new
locale/timezone data, allocation, per-value cache or TS change. TS regression and
reference controls are reported above. See the benchmark README and
[rule experiments](../benchmarks/temporal/rule-classification-experiments.json).

Earlier combined TS candidate wins all 48 medians and means against both pinned
references across three fresh processes each. Longer controls support four close
cases. Consumer is 41,503 gzip bytes (+385); import plus first operation is
~22.0 ms TS, ~39.7 ms basic and ~29.5 ms official, excluding process launch.
Original TS before/after regression audit remains open.
See [day-start experiments](../benchmarks/temporal/day-start-experiments.json).

Rust classifies safe ordinary months directly and keeps event evaluation near
possible shifted boundaries. Cold helpers handle remaining paths. Twelve prebuilt
controls improve ordinary offset lookup ~54%; all 37 cases pass the regression
screen. All 71 Rust/Node/Test262/ICU/Hermes checks pass. Fresh Rust/TS runs win
36/37, 37/37 and 36/37; original raw offset remains near tie/slower. Separate
25/7/3/2 counts retain original scope and add last-week/ordinary-month coverage.
Goal remains open. Benchmark README documents long controls and CPU profiles.
See [rule experiments](../benchmarks/temporal/rule-classification-experiments.json).

Previous TS calendar/field checkpoint shares bounded Gregorian conversion and
prepared ISO fields. Six full-48 controls improve field construction ~20%, date
updates ~34%, zoned formatting ~21% and hours-in-day ~24%. All 71 focused checks
pass. Consumer is 41,118 gzip bytes (+466); mixed cold use improves with unchanged
retained memory. Rust wins all 25 original plus 7 named cases in three fresh runs.

Scoped basic-reference losses remain: offset lookup 2.83x, day start 1.08x.
Final fresh all-48 references and startup remain pending. Original-baseline and
mixed-case rounding variability stay recorded; no blanket no-regression claim.
See [calendar/field experiments](../benchmarks/temporal/calendar-fields-experiments.json).

Earlier arithmetic/writer checkpoint: Rust wins 25/25 original plus 7/7 named-zone
workloads in each of three isolated optimized runs against accepted TS. Six
before/after Rust controls improve date formatting ~43% (106 ns to 60 ns) and
named offset lookup ~69% (59 ns to 18 ns). Largest median increase across 32
workloads is ~1.2%. All 66 focused Rust/Node/ICU/package/Hermes targets pass.
See [arithmetic/writer experiments](../benchmarks/temporal/recurring-arithmetic-experiments.json) for raw samples and limits.

Retained changes reuse guarded monthly-rule arithmetic, exact narrow/limb
nanosecond division, unsigned Gregorian era-day math and checked ASCII date
formatting. No new cache, data, dependency, public API or runtime struct layout.
Optimized benchmark executable grows 12,920 bytes (~0.30%); this includes
reference/data/harness and is not a shipped crate/SDK size claim.

TS at that checkpoint stayed byte-identical at 40,652 gzip bytes. Fresh repeated references
show 40/48 basic and 48/48 official median wins; resampling explains count changes.
Numeric offset caches improve hot reads but regress cold/full workloads; discarded.
Parser splitting enables V8 inlining without a reliable throughput gain; discarded.
CPU profiles, heap audits and all timing controls remain recorded. TS startup
was not remeasured because accepted source and bundle are unchanged. Eight basic
reference losses and the earlier baseline audit keep the goal open.

Preceding recurring-rule checkpoint: native Rust still wins 25/25 original and
7/7 additional named-zone workloads against current TS, reported separately.
Six optimized controls improve named offset lookup ~45% (106 ns to 59 ns),
day start ~38%, hours-in-day ~37%, day addition ~19% and time replacement ~31%.
Full signed outputs match. All 56 focused Rust/Node/ICU/package/Hermes targets pass.
See [monthly-rule experiments](../benchmarks/temporal/monthly-rules-experiments.json).

Separated monthly rules in February through November use one UTC year's event
pair. Validated offsets are below one day and rule times below seven days, so
events shift less than eight days. Interior months keep events inside their UTC
year; an intervening month preserves order. Edge/adjacent months and Day/Julian
rules retain the original three-year search. Public cases cover year rollover,
negative epochs, nanosecond boundaries, Instant limits, leap February and extreme
allowed offsets/rule times. New vectors pass both old and optimized algorithms;
independent ICU offsets/transitions pass too. No new data format or lookup cache.

TS fast-return experiments were discarded: focused field gains did not hold in
the full matrix. TS source and measured bundle are byte-identical to the preceding
checkpoint, still 40,652 gzip bytes. Latest resampling wins 38/48 basic and
48/48 official against retained references; prior identical TS scored 41/48
basic. These count changes reflect resampling variability, not evidence of TS
improvements or code regressions. Remaining losses, final fresh repeated references and earlier
baseline verification keep the goal open.

Per-input native diagnostics are separate timings, not CPU stack samples.
Optimized benchmark executable grows 224 bytes; it includes reference/data/harness
and is not a shipped crate/SDK size claim. Rejected TS V8 profiles and all raw
controls remain recorded.

Preceding ISO field checkpoint: TS wins 41/48 basic and
48/48 official medians using the preceding checkpoint's reference samples.
Rust wins 25/25 original and 7/7 additional named-zone cases against current TS,
reported separately. All 56 focused Rust/Node/ICU/package/Hermes targets pass.
Consumer is 40,652 gzip bytes (+109 this checkpoint). Final fresh repeated
references, remaining slower cases and earlier baseline audit keep the goal open.
See [immutable-slot experiments](../benchmarks/temporal/immutable-slots-experiments.json).

Short-date factories retain owned slots. Parsed ISO strings and year-month
addition retain validated ISO fields; formatting reuses those fields. Explicit
`dateFieldsView` returns a readonly ISO view after backend/range guards. General
pure-TS `dateFields` keeps fresh records. Arithmetic inputs are readonly.

Six full profiles compare three processes per state against `6588cdf` before
the provisional parser change. Combined medians improve YearMonth parsing ~17%,
MonthDay parsing ~38%, YearMonth addition ~12% and date addition ~4%.
Largest paired median increase is ~1.6%; Instant and PlainTime rounding medians improve slightly.
All initial outliers remain recorded. Smaller variations and earlier baselines
still need final verification. A broad readonly reader was replaced with the
explicit view after MonthDay conversion regressed.

Eager ISO fields cost ~88 extra retained bytes per unread parsed value in a
200,000-value Node diagnostic. After a getter read, candidate retains ~32 fewer
bytes/value. Arrays/WeakMap capacity are included; one process per state/kind/read
mode gives approximate heap evidence, not universal bounds. No native/Hermes heap
claim. CPU profiles and raw controls remain available.

Preceding short-date checkpoint: TS wins 38/48 basic and
48/48 official medians in a fresh comparison. Two TS processes,
one process per reference; final repeated references still required. Rust wins
25/25 original and 7/7 additional named-zone cases, reported separately.
All 54 focused Rust/Node/ICU/package/Hermes targets pass. Consumer is 40,543 gzip bytes.
See [validated-short experiments](../benchmarks/temporal/validated-short-experiments.json).

ISO short-date parsing uses already validated fields for shared Gregorian
conversion. Native dispatch, parsed reference-year handling and year-month bounds
remain. Full controls improve short-date parsing ~8–10%; scoped controls ~11–16%.
Parsed-field caching and three rounding variants showed no useful extra gain and
were discarded. Chronological benchmark samples now accompany sorted samples.

Goal remains open: reference losses, fresh repeated-reference verification and
regression audit. Unchanged rounding spans 456–566 ns in full controls
(aggregate +8.6%); longer scoped controls show +4.5% medians/~3% means.
Attribution remains unresolved. Original rounding code stays.
Raw runs and separate baseline/candidate V8 profiles remain available.

Preceding normalized-addition checkpoint used retained reference samples:
TS 36/48 basic, 48/48 official; consumer 40,529 gzip bytes.

`addNormalizedCalendarDate` returns epoch day plus validated target fields from
already normalized calendar fields. Date and YearMonth callers avoid repeated
conversions; raw APIs retain normalization. Target calendar availability and public
range checks still run before returning values. Independent ICU arithmetic, table,
relative-duration and zoned-difference oracles cover these paths.

DateTime clock getters now check for a native backend before creating private date
records. SDK's compile-time native path stays direct. Sparse field preparation uses
a frozen empty prototype with null parent: no Object.prototype inheritance or
omitted-key changes, with fast V8 property storage. Full-matrix checks rejected
numeric clock experiments that slowed rounding; original BigInt clock stays.
Precision checks one nanosecond inside Instant limits remain as regression guards.
All 54 focused Rust/Node/ICU/package/Hermes targets pass. Consumer size is 40,529
gzip bytes. Four full comparison profiles remove the confirmed rounding slowdown;
small remaining paired differences need final fresh repeated measurements.

Preceding shared-calendar/transition checkpoint:

`ArithmeticCalendarToEpochDay` owns numeric calendar conversion after callers
validate month/day. Gregorian calendars reuse the shared month-prefix table;
other arithmetic calendars sum lengths without repeated outer checks. Lunisolar
and Umm al-Qura paths stay with their providers. Rust transition lookup rejects
candidates that cannot improve the best result before evaluating recurring rules.
Alternating controls show faster date/year-month addition and roughly 2x faster
native transition lookup. No new caches or timezone data. That checkpoint passes 49 focused Rust/Node/ICU/package/Hermes targets and ships
40,470 gzip bytes.

The seven new native named-zone workloads retain exact signed outputs and use
compiled IANA data versus TS host Intl. They cover New York gap/fold, Lord Howe
half-hour changes and year2400. Original25 and temporal_rs comparisons stay intact;
the UTC-only temporal_rs benchmark provider is excluded from new cases. Select
`FORMATJS_TEMPORAL_NATIVE_PROFILE=named` for isolated named-only comparisons;
`FORMATJS_TEMPORAL_NATIVE_DIAGNOSTICS=1` adds separate per-input native timings.

Preceding direct-path optimizations reuse fixed ISO field-name lists, format
PlainTime with exact numeric clock arithmetic, validate Gregorian month lengths
directly and skip redundant parsed short-date roundtrips. That checkpoint passes
44 focused targets, wins 34/48 basic and 46/48 official raw medians against fresh
isolated references, and ships 40,399 gzip bytes.

Preceding record preparation preserves owned field shapes instead of deleting keys,
uses one ISO merge record, and avoids redundant caller copies/calendar reads.
Duration conversion reuses the complete JS reader and skips duplicate validation
of already validated owned fields. One static property-read order serves both
duration readers; `Duration.with` no longer observes `Array.prototype.sort`.
Public prototype/array-observation regressions and 42 focused Node/ICU/package/
Hermes targets pass. Native Rust is retimed against this candidate, not older TS.

Shared Gregorian conversion computes the civil year once. Date getters reuse
private immutable ISO fields under a unique symbol; native backend checks and normal/extended bounds
precede reuse. Returned calendar records remain uncached to avoid aliasing.
ISO derived fields use Gregorian arithmetic directly. Date-only serialization
avoids constructing an Instant and clock string. No formatted-output cache.
Each accessed ISO date slot retains one field record for its lifetime.
Alternating controls confirm roughly 7x faster date getters and 5x faster date
formatting. Current export-all consumer is 40,219 gzip bytes (+470 over the
no-WASM baseline, +144 over the ISO checkpoint); performance goal is open.

The shared borrowed calendar provider now advances year starts once within each
64-year checkpoint block. No cache or data format change. Independent ICU/HKO
controls and checkpoint/leap/final-year boundary tests guard conversions.

Earlier implementation goal (WASM measurements are historical): complete Temporal
in TypeScript and Rust, support Hermes, validate against
Test262 and independent ICU oracles, compare `temporal-polyfill`, measure WASM
versus TypeScript size and speed. Deliver incremental stacked PRs using `gh stack`.

## Typed Rust zoned replacements

`ZonedDateTime::with_time_zone` preserves Instant/calendar and can change the
provider type without cloning the source provider. `with_time(Some(time))`
replaces all clock fields with compatible gap/fold resolution, ignoring the
source offset hint. `with_time(None)` reuses the earliest civil-day boundary.
Independent ICU controls exercise 17,640 offset samples, 1,900 transition windows
and 5,292 day boundaries through these public methods. A two-hour gap across
midnight distinguishes omitted time from explicit midnight; boundary cases check
range rejection and exact nanoseconds. Existing native bindings already expose
`timeZoneResolve` and `startOfZonedDay`; ABI 9 and its 62 operations stay unchanged.

The current completion ledger is [015a](015a-temporal-completion-audit.md).

## Typed Rust field updates

PlainTime, Duration, PlainDate, PlainDateTime, PlainYearMonth, PlainMonthDay and
ZonedDateTime expose `with_fields` with optional typed fields. Clock regulation
is shared with the existing `regulatePlainTime`
binding; ABI 9 and its operation set stay unchanged. Duration updates retain
unbalanced fields and validate the complete resulting duration. Calendar merging
preserves month codes, clears dependent era/year fields and ignores unsupported
eras for ISO/Chinese/Dangi. PlainDateTime accepts full calendar fields with omitted
time fields defaulting to midnight. JS still owns observable coercion and field
access order. YearMonth ignores supplied days, normalizes its reference day and
supports extended reference dates. MonthDay merges without its reference year.
Calendar merges start with year/monthCode/day selected for the value type,
without derived era fields, following
[ISODateToFields](https://tc39.es/proposal-temporal/#sec-temporal-isodatetofields).
ZonedFields includes an optional nanosecond offset hint. ZonedWithOptions defaults
to constrain/compatible/prefer; parsing retains its separate reject default.
Zoned updates reuse exact-offset resolution, preserving the original fold offset
when possible and supporting prefer/use/ignore/reject policies.

Independent ICU field rows exercise updates through arithmetic and borrowed
calendar providers; 25,269 ICU epoch samples verify partial clock regulation.
Boundary cases cover leap-month fallback, Japanese era changes, mixed duration
signs, large fields, date bounds and preservation of omitted fractional units.
The all-calendar short-date corpus exercises updates for its 4,992 MonthDay rows.
All 17,640 independent ICU offset samples exercise zoned fractional updates;
the 1,900 transition windows additionally check partial field gap/fold policies.

## Host Intl data policy

Host `Intl` is an allowed dependency for the TypeScript implementation. Default
TS uses compact arithmetic/data for Chinese/Dangi and captured host Intl for Umm
al-Qura and named timezone operations. Default ships generated IANA identifiers
and conservative transition-search intervals, without offset histories. Installed
Intl may be native or a FormatJS polyfill; load it before Temporal captures its
intrinsics. No formatter package import or circular dependency is introduced.
The explicit `standalone.js` entry retains full calendar packs and owned IANA
histories/future rules. Both Rust WASM profiles and the Hermes SDK retain owned
timezone data. Earlier measurements below describe their historical data policy.
Capture host intrinsics before installing Temporal's Intl adapters to avoid
recursion. Validate host-backed calendar conversion, timezone transitions and
range boundaries with Test262 and independent ICU oracles, including Hermes.

Legacy DateTimeFormat corrects Chinese/Dangi calendar fields when host data
differs from Temporal's verified engine. Numeric Date inputs, Temporal projections
and locale methods share this path. Host formatters supply labels in the requested
locale and numbering system; original weekday, clock and timezone fields survive.
Safe host month examples supply localized month/day labels. Related years and
sexagenary names are restored separately. Captured intrinsics avoid recursion
after installation. Ranges whose corrected fields invalidate native collapsing
use complete endpoint patterns with a captured host range separator.

All 130 Temporal DateTimeFormat executions pass on Node TS/WASM and Hermes
source/bytecode through the legacy adapter, with zero tracked failures. This
scope is now a regular gate. Independent public-package controls verify 8,708
Chinese/Dangi authority-range field rows, including 34 older-host disagreements;
localized label controls use independently verified matching dates. Hermes
fault injection additionally forces stale year/month/day fields to exercise
correction and range fallback even when native ICU data already agrees.
Non-Gregorian plain formatting now uses safe Gregorian-cycle surrogates, then
restores owned calendar fields, localized years, eras and month labels. This also
avoids host calendar failures at valid extreme Date values. Plain ranges retain
native collapsing when fields match; changed fields use complete endpoint
patterns. Japanese labels select the actual era and preserve first-year forms.
Only Before Hijrah labels need bundled CLDR data; the generated calendar metadata
package supplies three widths with locale inheritance and explicit root parents.
No full DateTimeFormat locale packs are added.

New forward ICU4J boundary controls cover 60 DateTime/YearMonth rows across ten
calendars. The existing Hebrew/Persian/astronomical oracle limits remain explicit;
all fourteen non-Gregorian calendars have public formatting/range controls.
TS and both WASM delivery profiles run five numeral systems, including
supplementary-plane digits. Hermes source/bytecode run the same ICU rows through
the legacy adapter with native DateTimeFormat and NumberFormat primitives.
Generator controls compare all 657 CLDR locales plus explicit root-parent cases.
Numeric Date/Instant formatting and ZonedDateTime locale methods now use the
same calendar restoration for non-lunar calendars. Captured Gregorian fields
identify the local ISO date in the formatter's timezone; original weekday, clock
and timezone labels survive. Gregorian era probes compare captured positive-era
labels and request Latin digits explicitly, avoiding English-only assumptions.
An ISO-calendar probe can omit the era on older ICU, turning BCE years positive.
Full legacy Intl compliance remains under audit. Numeric lunar boundaries now
recover from host ICU failures through the same safe-year path, preserving the
original local ISO day when labels use UTC. Safe reference patterns retain lunar
year requests omitted from native resolved options. TS and both WASM profiles
check 24 calendar/date/timezone combinations each, including numeric Date,
Instant, ZonedDateTime locale methods, clocks and ranges. These verify field
consistency beyond the independent astronomical oracle bounds; they do not extend
those bounds. Hermes-specific boundary controls remain pending.

The numeric-era corpus selects 81 independent ICU rows across nine calendars,
including full Date bounds, BCE years, the 1873 Japanese boundary and modern
compatibility. Each TS/WASM/Hermes profile checks 936 locale/timezone combinations,
including Date/Instant/Zoned locale formatting and equal/cross-era ranges. Locale
fallback controls force the internal probe to Arabic. A separate host-boundary
fault forces Coptic formatting to throw at a valid Date; Gregorian clock fields
and a safe calendar surrogate recover the output. No new calendar data is added.

Compare host-backed TS against `temporal-polyfill/full/implementation` using the
same host and supported calendars. Report standalone data costs separately.
Earlier default TS consumers measured 68,089 bytes gzip; standalone measured
336,635. Both included owned timezone data. The roughly 23 KB gzip full reference
used host Intl data; those profiles had different data policies. Current default
and measurements appear in the installed Intl follow-up below.

`host-timezone.ts` originally prototyped captured Intl offset queries and local-time
resolution, including nanoseconds, historical second offsets and instant bounds.
That prototype was not wired into the default namespace: Intl has no transition
enumeration API, and an arbitrary search horizon cannot prove the nearest
transition. Current default uses the documented bounded search policy below.
Strict Hermes/ICU checks cover 597 supported names, 17,640 future offsets and
1,900 gap/fold windows in source and optimized bytecode. Node 24/26 reference
tests compare the same corpus against `temporal-polyfill` on the same host.
The manual `host_timezone_icu_test` retains strict independent diagnostics:
Node 24 tzdb 2025c has 290 failing assertions; Node 26 tzdb 2026c has 40, matching
the reference, against ICU tzdb 2026e. Reference parity is not ICU compliance.

The generated `tz/temporal-compact.js` represents finite offset events
as fixed timestamps plus recurring-rule year spans. It preserves the final
explicit timestamp and existing future rules. Generator reconstruction and
runtime tests verify all 19,793 retained events across 457 concrete zones,
including neighboring nanoseconds and full-range transition probes. Abbreviations
and DST flags are omitted; this representation is only for Temporal, never
DateTimeFormat zone-name formatting. The generated TS file measures 33,160 bytes
gzip before bundling; this is not a shipped consumer measurement. Default and
standalone namespaces decode this representation lazily per zone. DateTimeFormat
bundles set `formatjsTemporalCompactTimeZones` false to share their existing
abbreviation/DST data. Native-data-only profiles exclude both TS representations.
Hermes validates the compact default against the complete independent timezone
corpus in source and optimized bytecode, including 14,058 strict transition rows
and 178,503 identity pairs.

## Current state

`packages/temporal` owns the TypeScript implementation and tests. Its workspace
name is `@formatjs/temporal`; its first public npm release is 1.0.0.
Release Please tracks its Bazel version and package manifest. Subsequent npm
releases use the repository's `release.yml` trusted publisher.

Rust crate `formatjs_temporal` starts at 1.0.0. `//crates:intl_release` bundles
its generated calendars/timezones and a Cargo build script, so published features
work without Bazel. Release Please tracks `crates/temporal`; `crates-release.yml`
publishes through crates.io trusted publishing.
`benchmarks/temporal` owns comparisons and measurement records.

The public entry exports Instant, Duration, PlainTime, PlainDate, PlainDateTime,
PlainYearMonth, PlainMonthDay, ZonedDateTime, Now and installation entries. TS supplies
all 16 specification calendars, with host Intl Umm al-Qura data and owned IANA
timezone data. Native Intl integration
and complete native distribution remain open.

`crates/temporal` supplies an allocation-free `no_std` core with shared numeric
calendar math. Experimental Hermes/WASM backends delegate ISO conversion,
Instant/Time/Duration operations, all 16 calendar engines, IANA queries, plain and
zoned/short-date arithmetic, rounding, string parsing and date formatting to Rust. Zoned grammar runs before
JS option reads; typed resolution follows. JS retains coercion, option order,
brands/slots and allocation.
The optional Hermes SDK installer supplies per-runtime host clocks/timezones.
Native Intl Temporal conformance and full-backend artifact assessment remain pending.

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
checks never certify calendar/Intl conformance.

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

## Optional WASM backend

`@formatjs/temporal/wasm.js` exposes `configureWasmBackend(instance)`. Load the
packaged `temporal-backend.wasm` with the application's asset loader, instantiate
it, then select it for the existing namespace:

```ts
import {Temporal} from '@formatjs/temporal'
import {configureWasmBackend} from '@formatjs/temporal/wasm.js'

const {instance} = await WebAssembly.instantiate(bytes, {})
configureWasmBackend(instance)
Temporal.Instant.from('2020-02-29T12:00Z').round('hour')
```

`bytes` contains the packaged WASM asset. Configuration preserves constructors
and existing values; it does not install globals. The optional module can be
imported on Hermes, but activation fails explicitly there because WebAssembly
is unavailable. TS remains the default. Rust JSI uses the separate Hermes profile.

This backend delegates ISO conversion and Instant parsing, formatting, arithmetic,
rounding and differences to Rust. Other algorithms and owned calendar/timezone
data remain TS. It is a partial backend, not complete native Temporal. No selected
Rust operation falls back to TS after an error.

The WASM profile passes 8,570 pinned Test262 executions, including the full 934
Instant cases. Published-package controls verify 25,265 ICU Gregorian rows,
2,349 BigDecimal rounds and 3,168 signed differences. Tests also exercise actual
shared backend state, memory growth, repeated errors/freeing, malformed UTF-16,
ABI rejection and captured codecs/views. Hermes source and optimized bytecode
verify optional import and explicit unavailability without breaking TS.

On the recorded Node/V8 host, this JSON bridge is slower than TS across all five
measured Instant operations. The consumer bundle is 420,004 gzip bytes including
WASM versus 360,183 TS bytes. The binary itself is 132,990 raw / 58,527 gzip bytes.
Both profiles include owned TS calendar/IANA data; they retain TS fallback code.
This does not establish full native/WASM backend costs or a default-backend choice.
See `benchmarks/temporal/wasm-facade-results.json` for raw samples and delivery modes.

## Rust PlainTime backend

Hermes and WASM now delegate PlainTime parsing, field regulation, formatting,
add/subtract, rounding and until/since to Rust. JS retains coercion/property order,
slots, brands, projections/comparisons and shared locale integration. The shared
rounding operation returns unwrapped nanoseconds so PlainDateTime/ZonedDateTime
preserve day carry; PlainTime wraps its own result. Large finite fields constrain
before integer narrowing. Selected operations never fall back after native errors.

WASM ABI version 2 requires the matching packaged binary. Version-1 instances are
rejected before replacing the active backend. The source/HBC/WASM full PlainTime
Test262 gate passes all 986 executions; wider hybrid profiles pass 9,322 per mode.
Other class algorithms and native calendar/timezone data remain unfinished.

Shared independent controls run against pure TS, Hermes source/HBC and the real
published WASM package: 25,269 ICU clock rows (parse/format/add/subtract), 7,740
BigDecimal rounds plus date-time day carry, and 1,656 signed differences checked
both directions. Tests cover ignored date units, huge finite fields, invalid
UTF-16 and mandatory native calls for all six operations.

Fresh benchmark records include PlainTime on Hermes and V8/WASM. Hermes bytecode
time formatting takes about 3.14 microseconds Rust versus 8.33 TS; add is slower,
21.40 versus 12.97. On the recorded V8 host the WASM JSON bridge loses to TS across
all five time workloads. Consumer bundle totals are 360,302 gzip bytes TS versus
424,735 WASM profile; binary alone 147,964 raw /62,954 gzip bytes. These remain
partial native profiles with retained TS code/data, not full-backend comparisons.

## Native calendar bridge

The shared native backend now delegates calendar conversion/inversion, month/year
metadata, era resolution, addition and differences to Rust for all 16 calendars.
Bazel `:with_ffi` embeds the existing generated calendar descriptors. A process-
local `OnceLock` validates and retains the immutable registry once; independent
WASM instances own independent registries. No runtime formatter dependency enters
Temporal. The default no_std core still excludes data and allocation.

JS retains coercion/property order, private slots, date/relative/zoned orchestration
and timezone algorithms. Selected native operations never fall back after errors.
Extended calendar coordinates remain available for short-date reference windows;
public callers retain their narrower range checks. Constrained month/day values
clamp before Rust integer narrowing. WASM ABI 3 requires matching packaged binary.

Public-class ICU controls run against Hermes source/optimized bytecode and the
actual published WASM package. They cover all 16 calendars, inverse bags, eras,
calendar arithmetic/differences and plain/UTC-zoned relative Duration windows.
The checker accepts the actual namespace, preventing a duplicate TS bundle from
standing in for the packaged WASM implementation. Remaining native bindings,
Hermes SDK installation, Intl adaptation and full-backend comparisons stay open.

Full eight-class Test262 gates now pass 9,090 executions per Hermes source/HBC
and WASM mode, with zero tracked failures or new exclusions. Separate calendar
regression gates overlap those cases; Now and installation gates also pass.
This does not establish complete Intl integration or a complete Rust backend.

Calendar benchmark snapshots live under `benchmarks/temporal/*calendar*results.json`.
Rust improves three of five measured Hermes ISO date workloads; WASM loses to TS
on all five. Current consumer bundles total 360,454 gzip bytes TS versus 677,568
WASM, including the 315,320-byte native binary and retained JS calendar data.
Equivalent full-native backend size/performance proof remains open.

## Native timezone bridge

Bazel `:with_ffi` now embeds the same checked IANA records/footer rules as the
typed Rust timezone registry. Shared JS zone kernels delegate identity, exact
nanosecond offsets, candidate instants, local disambiguation and strict transitions
to Rust. Named aliases retain spelling separately from primary identity. Offset
zones and UTC use the same backend selection as named zones.

Cached kernels read the current backend on each operation. Objects created before
activation use Rust afterwards; backend errors propagate without trying TS.
The TS transition decoder remains lazy fallback data/code. Rust shares candidate
visitation between typed local resolution and FFI; only FFI allocates output arrays.
WASM ABI 4 rejects ABI-3 modules before replacing an active backend.

Independent ICU public controls run on TS, Hermes source/HBC and the published
WASM package: 597 identities, 178,503 identity pairs, 17,640 future offsets,
1,900 gap/fold windows and 14,058 strict transition rows. Transition checks include
both directions, nanosecond boundaries and advancing follow-up queries. Offset
windows cover years 2101, 2400, 2500, 10000 and 275000; resolution checks compare
calendar versus elapsed days and relative Duration ordering. Native tests warm
named/fixed kernels before installation and reject all cached operations under a
failing replacement backend, proving that cached TS providers cannot bypass Rust.

Date/relative/zoned orchestration, remaining native class methods, real Hermes
SDK installation and native Intl brand/styles/range integration remain open.
Full backend comparisons remain required; these are still hybrid facades.

The 50-target regression run passes full eight-class native/Hermes/WASM selections
(9,090 executions per mode), overlapping calendar/Now/install gates, ICU controls
and the default TS full ZonedDateTime selection. No new exclusions or tracked
failures. Calendar Hermes gates use a longer timeout after parallel execution
exceeded 300 seconds; both pass rerun. A subsequent cached-name fast path passes
nine focused targets, including full ZonedDateTime on all four configurations.

Current consumer bundles total 360,695 gzip bytes TS versus 755,755 with WASM.
The native binary is 393,101 gzip bytes; retained JS data duplicates native packs.
Zoned benchmarks improve four of five Hermes cases with Rust; WASM loses all five
against TS. See `benchmarks/temporal/*timezone*results.json` for samples and scopes.
Remaining native orchestration, SDK installation, Intl integration and equivalent
full-backend comparisons remain required.

## Native Duration bridge

Hermes/WASM now delegate Duration parsing, normalized range checks, formatting,
add/subtract, negated/abs, comparison, totals and rounding to Rust. Plain-date and
zoned relative operations send normalized anchors to typed Rust adapters, retaining
all 16 calendars and owned IANA providers. Calendar registries validate once;
request-local anchors borrow their immutable data. JS retains input coercion,
property access order, brands/slots, field projections and sign/blank metadata.

Native relative operations replace repeated JS/native scalar crossings with one
calculation request. JS never retries a selected native operation after errors.
WASM ABI 5 requires the matching asset; ABI-4 instances reject before activation.
The default TS implementation remains available through the same facades.

Rust Duration::round adds unanchored day/time rounding with DateTimeUnit, including
multi-day increments. It uses Duration bounds rather than an invented Instant
anchor. A billion-day Duration remains valid without relativeTo; an anchored
operation still checks its endpoint range. Calendar units require a real anchor.

Independent controls now parameterize the actual namespace: 5,430 scalar cases,
51,840 plain rounds, 17,280 plain totals, 4,224 plain comparisons, 19,440 zoned
rounds and 6,480 zoned totals on TS, Hermes source/HBC and the published WASM
package. Existing calendar controls add relative windows across all 16 calendars.
Native fault injection isolates each Duration operation while other Rust calls
remain live, proving that relative algorithms cannot silently use the TS path.
Remaining native date/zoned orchestration, Now, SDK installation and Intl
integration remain required for the full goal.

Duration bridge validation: 51 regression targets pass, including all eight full
native class suites (9,090 executions per Hermes source/HBC and WASM mode),
independent ICU controls, default TS full Duration, package and Rust core/ABI
checks. No new exclusions. These remain hybrid-backend results.

Matched Duration benchmarks improve Hermes formatting and relative round/total;
parse/add still pay bridge costs. WASM loses all five Duration cases to TS on the
recorded host. Consumer gzip: TS 360,908 bytes; WASM JS +binary 773,668 bytes,
including retained TS fallback packs. See `benchmarks/temporal/README.md` and its
Duration snapshots for methods, reference timings and startup costs.

## Native plain date arithmetic

Hermes/WASM now delegate PlainDate and PlainDateTime add/subtract and
until/since to typed Rust engines. PlainDateTime rounding also runs in Rust,
including midnight carry and day rounding. JS retains operand coercion, option
access order, brands/slots and object allocation. Already-created operands use
the active backend; selected native errors propagate without a TS retry.
Five operations bring the normalized bridge to42 operations. WASM ABI6 rejects
older assets before activation. Date parsing/formatting and remaining short-date/
zoned orchestration still use TS; complete native SDK installation remains open.

Independent ICU controls run through each actual namespace on TS, Hermes
source/HBC and the published WASM package:840 arithmetic rows,7740 clock rounds,
126 day rounds, plus existing plain-relative date/date-time differences and all16
calendar windows. Arithmetic verifies both add and subtract, nanosecond carries,
metadata and out-of-range endpoints. Per-operation faults isolate all five new
native operations using operands created before backend activation.

PlainDate retains its extra minimum boundary day without inventing an invalid
PlainDateTime midnight. Direct ABI controls cover that boundary, negative
nanosecond carry and invalid units/increments/calendar IDs.

Validation:55 regression targets pass, including eight full native class suites
(9090 executions per Hermes source/HBC and WASM mode), default TS full Date1308,
DateTime1552 and Duration1086, independent ICU controls, package checks and Rust
core/ABI tests. No new exclusions. Backend remains hybrid.

Matched Hermes bytecode benchmarks improve all five Date/DateTime arithmetic
cases against TS. Date differences:58.13 to26.60 microseconds; DateTime
differences:61.43 to27.80. WASM loses all five to TS on this host. Consumer gzip:
TS361,031 bytes; WASM JS +binary779,413, including retained fallback data. See
`benchmarks/temporal/README.md` and the plain-arithmetic snapshots for methods,
reference comparisons, startup costs and scope.

## Native zoned arithmetic

Hermes/WASM now use typed Rust engines for ZonedDateTime add/subtract,
until/since, clock/day rounding, startOfDay and hoursInDay. Calendar additions
resolve local time before elapsed clock additions; day queries use actual civil
boundaries, including historical midnight gaps and repeated dates. JS retains
operand coercion, option order, brands/slots and allocation. Selected native
errors propagate without a TS retry. Five operations bring the bridge to 47;
WASM ABI 7 requires the matching asset.

The same registry supplies all 16 calendars, IANA aliases, fixed offsets and future
recurring rules. Relative Duration anchors share the normalized zoned adapter.
Existing objects select the active backend per operation. Fault controls use
pre-activation operands in New York, Lord Howe and year 2400 US/Eastern.

Independent ICU controls verify 19,440 zoned differences in both directions and 5,292
civil-day rows: earliest boundary, hoursInDay and all nine day-rounding modes.
Shared verifiers accept the actual TS, Hermes source/HBC or published WASM namespace.
Existing independent timezone controls retain future gap/fold additions and
calendar-versus-elapsed-day checks. Direct ABI controls verify alias equality,
23-hour calendar days, explicit civil boundaries, cross-zone elapsed differences
and rejection of cross-zone calendar differences or invalid increments/bounds.

Date parsing/formatting, short-date operations, real Hermes SDK installation and
native Intl integration remain open. These remain partial native-backend results.

Validation: 59 regression targets pass, including all eight full native class suites
(9,090 executions per Hermes source/HBC and WASM mode), default TS full Zoned 1,804,
Date 1,308, DateTime 1,552, Duration 1,086, independent ICU controls, package checks and
Rust core/nine ABI tests. No new exclusions. Backend remains hybrid.

Matched Hermes bytecode benchmarks improve all five zoned cases against TS;
hour rounding drops from 47.68 to 9.81 microseconds (reference 27.18). Reference
comparisons vary. WASM loses all five to TS here. Consumer gzip: TS 361,109 bytes;
WASM JS +binary 783,358, including retained fallback packs. See the zoned-arithmetic
snapshots and `benchmarks/temporal/README.md` for methods and startup costs.

## Native string parsers

Hermes/WASM now delegate PlainDate, PlainDateTime, PlainYearMonth and PlainMonthDay
strings to typed Rust parsers with all 16 calendars. Zoned grammar runs in Rust
before JS option reads; typed Rust offset/disambiguation resolution runs afterwards.
This preserves invalid-string rejection before option getters. Date-only civil
boundaries and historical minute-versus-exact offset matching retain their rules.
Six operations bring the normalized bridge to 53; WASM ABI 8 requires the matching
asset. JS retains coercion, option access, brands/slots and object allocation.
Selected native errors propagate without a TS retry.

Native missing offsets normalize to an own undefined property, keeping inherited
Object.prototype.offset getters out of parsing. Escaped UTF-16 code-unit guards
cover all parser operations before UTF-8 transport. Option-order, invalid-string,
lone-surrogate and inherited-offset controls run on each actual namespace.

Independent ICU controls verify 25,269 cases for each plain parser and 17,640 zoned
rows in exact-offset and UTC-offset forms, including years 2101, 2400, 2500, 10000
and 275000. Source/HBC Hermes, published WASM and pure TS use the same verifier.
Per-operation faults require each native parser and zoned resolution. Direct ABI
controls cover minimum YearMonth, ignored ISO MonthDay reference years, leap-day
rejection and historical offset precision.

Date formatting, short-date arithmetic, native Now host integration, real Hermes
SDK installation and native Intl integration remain required. These remain partial
native-backend results.

Validation: 61 regression targets pass, including all eight full native class
suites (9,090 executions per Hermes source/HBC and WASM mode), default TS full
Date/DateTime/Duration/Zoned suites, independent ICU controls, package checks and
Rust core/ten ABI tests. No new exclusions. Backend remains hybrid.

Matched Hermes bytecode benchmarks improve all five parser workloads against TS.
YearMonth parsing +getter drops from 21.89 to 10.60 microseconds; zoned parsing
from 66.37 to 38.83 (reference 52.36). Reference comparisons vary by type. WASM
loses all five to TS here. Consumer gzip: TS 361,230 bytes; WASM JS +binary 794,070,
including retained fallback packs. See the string-parser snapshots and
`benchmarks/temporal/README.md` for methods, reference results and startup scope.

## Native date output and short-date operations

Hermes/WASM now delegate Date, DateTime, YearMonth, MonthDay and ZonedDateTime
formatting to typed Rust. YearMonth add/subtract/difference and both short-date
`toPlainDate` conversions use Rust too. Nine operations bring the bridge to 62;
WASM ABI 9 requires the matching asset. JS retains coercion, property access,
option order, brands/slots and allocation. Native errors propagate without retry.

Rust formatting supports all four calendar annotation modes, reference fields,
rounding carry, zone aliases, offset suppression and critical zone annotations.
Unrounded YearMonth differences avoid an unnecessary out-of-range next anchor at
`+275760-09`. Short-date conversion constrains large positive days before narrowing;
the TS calendar fallback now accepts these finite integers too.

The shared verifier runs 2,028 independent ICU short-date rows on TS, Hermes
source/optimized bytecode and published WASM. It checks signed addition/subtraction,
leap-day conversion, all nine difference rounding modes and bounds. Explicit
controls cover formatting annotations, retained reference fields, midnight carry,
aliases and option coercion order. Fault injection requires all nine native
operations; direct Rust API/ABI tests cover formatting, boundaries and validation.

Native Now host integration, Hermes SDK installation/distribution, native Intl
integration and equivalent full-backend artifact comparisons remain open.

Validation: 65 regression targets pass, including all eight full class suites
(9,090 executions per Hermes source/HBC and WASM mode), overlapping calendar gates,
default TS Date/DateTime/Duration/Zoned/YearMonth/MonthDay suites, ICU controls and package checks.
Direct Rust validation passes 32 core and 11 ABI tests. No new exclusions.

Matched Hermes bytecode benchmarks improve all eight new workloads against TS.
Zoned formatting falls from 33.17 to 7.32 microseconds (reference 13.60). Reference
wins five of eight cases. WASM loses all eight against TS on V8. Consumer gzip:
TS 361,460 bytes; WASM JS +binary 805,972, including retained fallback packs.
See the date-output snapshots and `benchmarks/temporal/README.md` for all timings,
reference comparisons and startup/size scope. Backend remains hybrid.

## Hermes SDK host integration

The optional SDK adapter now exposes `formatjs::installTemporal(runtime, host)`.
Install Intl first. The host supplies its current IANA timezone identifier and may
supply decimal epoch nanoseconds; the default uses the C++ system wall clock with
millisecond precision. Providers stay isolated per runtime and live until runtime
teardown. Repeated installation does nothing. The SDK uses the existing unified
Rust archive. CMake consumers opt in with `formatjs_temporal(target)` after
`formatjs_intl(target)`; Bazel consumers link `:temporal` alongside `:intl`.

A shared accessor factory fixes getter captures when Hermes block scoping is off.
The default-runtime C++ test independently exercises these getters, non-UTC Now,
clock bounds, captured intrinsics and provider lifetime. Test262 still enables
block scoping for test-language features. DateTimeFormat and DurationFormat accept
late Temporal registration, including existing formatter instances, private brands
and duration strings. Public field/format overrides do not replace private reads.

Validation: 91 regression targets pass. Direct SDK class gates add 9,090 executions
per source/HBC mode, plus calendar/Now/installation gates, to the prior TS, WASM and
experimental bridge coverage. SDK Now matches 17,640 independent ICU offset rows,
including post-2100 rules. Native formatter regressions compare 9,440 DateTimeFormat
and 3,663 DurationFormat cases per mode with TS. The extracted SDK's independent
Linux consumer passes both source/HBC setup paths without a Rust toolchain.
No new exclusions. Native Intl Temporal conformance and completion audit remain open.

Actual SDK hot-operation benchmarks vary: zoned formatting measures 9.17
microseconds against TS 33.06 and reference 13.47; repeated calendar getters are
slower than both. WASM consumer gzip: 361,482 bytes
for TS versus 805,994 for WASM JS +binary, including
fallback packs. The stripped native app adds 6,865,280 raw
/838,100 gzip bytes over the identical Intl/Hermes baseline.
See SDK-host snapshots and `benchmarks/temporal/README.md` for methods and limits.

## Native Temporal locale bridge

The Hermes DateTimeFormat adapter exposes the same private `__formatTemporal`
record bridge as TS. Temporal `toLocaleString` passes exact decimal nanoseconds,
kind and calendar to Rust; numeric Date inputs still use TimeClip. This preserves
`-271821-04-19`, which PlainDate accepts before the minimum Date instant.
YearMonth/MonthDay date styles omit reference day/year fields. Zoned defaults
include a short timezone name, reject an explicit `timeZone` option and preserve
the value's timezone. Public DateTimeFormat still rejects ZonedDateTime values.

Construction keeps locale resolution, timezone coercion, component reads, data
snapshot and late style reads in their existing order. The private construction
context never becomes a public constructor argument. SDK locale validation uses
768 independent ICU4J style/skeleton cases across four locales, seven Temporal
kinds and four timezone choices, on Hermes source and optimized bytecode.

SDK locale gates reuse the existing 306-case strict locale suite and its single
CLDR49 zero-name exclusion. The two full SDK Intl diagnostic gates run all 4,080
executions per source/HBC mode: 4,076 pass, four fail. They retain the POSIX-primary
identity and fixed-zero-name differences described above; the diagnostic baseline
still expects zero failures. No implementation failures enter accepted baselines.
The default-Hermes C++ SDK test separately verifies the extra minimum PlainDate.

## Native facade data ownership

`fallback-data.ts` owns the six generated TS calendar/timezone imports. SDK and
`wasm-native.js` builds set `import.meta.formatjsTemporalNativeData` and eliminate
those imports. Fallback data access throws instead of retrying against missing
JS tables. Default TS entries explicitly set the flag false. Algorithms and
observable ECMAScript semantics remain shared; this is data ownership, not proof
that every native orchestration requirement is complete.

`configureTemporalWasm(instance)` returns the dedicated native-data namespace;
`installTemporalWasm(instance, force)` installs it through the existing global/Date
bridge flow. This entry has separate backend/brand state from the index/wasm pair.
WASM Test262 payloads now use the native-data build. Published-package tests run
both WASM entries against the existing independent ICU/calendar authority fixtures.
The native entry's sourcemap must contain no generated TS calendar/timezone module.

`formatjs_library(entry_point_defines=...)` selects constants per published entry.
The shared bundler now passes constants through Rolldown `transform.define`; the
old top-level option was ignored. No Temporal ABI or Rust table changes.

Native-data validation: 96 regression targets pass, with full class gates and the
same independent ICU/calendar authority cases on both WASM package variants.
The rebuilt standalone SDK consumer passes source/HBC installation, native Chinese
fields, extended PlainDate locale formatting and fixed-zero names. No new exclusions.
Consumer gzip is 469,793 bytes for native-data WASM versus TS 360,710 and retained-data
WASM 806,221. WASM loses all 43 V8 hot workloads to TS. The stripped native SDK app
adds 3,570,640 raw /492,729 gzip bytes over identical Intl/Hermes. See the native-data
benchmark snapshots for methods, all timings and runtime-size scope.

## Legacy Intl constructor integration and formatter scope

Temporal installation now adapts legacy Intl.DateTimeFormat when no private
Temporal record bridge exists. The adapter retains the native prototype and
constructs real native formatter instances. Captured native bound functions map
to private projection state, preserving legacy constructor unwrapping without
reading the legacy symbol twice. Constructor options are converted once in native
access order. Plain formatting uses UTC; kind-specific styles and component
records omit unrelated fields. Existing owned TS and native SDK bridges bypass
this adapter.

The completion audit found a separate upstream scope: 65 DateTimeFormat files
carry the Temporal feature, outside intl402/Temporal. New count-checked targets
require all 130 executions and zero failures on owned TS/Node, WASM, Hermes TS
source/HBC and native SDK source/HBC. The test prelude now includes ar/ar-EG data.
No Realm or implementation exclusions added. Native-host and adapted diagnostics
also compare 362 non-Temporal DateTimeFormat executions; their 20 pre-existing
failure cases match, including preserved prototype-realm and chaining behavior.

Legacy-host diagnostics still expose Date TimeClip at extended plain bounds and
host lunisolar data differences. Their expected failures remain empty. Full goal
completion also requires the remaining Rust/API audit; these new formatter gates
do not establish full legacy-host compliance.

The Intl feature inventory also finds six DurationFormat files (12 executions).
Late registration and legacy-host adaptation now close this scope; see the
DurationFormat integration evidence below. Native SDK keeps its existing hook.

The legacy Intl layer passes 104 focused regression targets, all three actual
TypeScript checkers, SDK assembly and the standalone Hermes SDK consumer smoke
test. The short-style ICU oracle checks 384 cases across eight locales, two
short-date kinds, four styles and six epochs. ICU independently chooses component
widths; host Intl supplies its locale names and literals. A separate strict raw
ICU-string diagnostic retains the Russian spacing differences between pinned
Node ICU 78.3/CLDR 48 and ICU4J 79/CLDR 49. No string normalization or accepted
failure baseline hides those differences.

`benchmarks/temporal/legacy-intl-size-results.json` records this layer's size:
361,031 bytes gzip for the bundled TS namespace, 365,058 for forced installation,
23,226 for the full host-backed reference. These are runtime consumer bundles,
not npm archive sizes. They still include owned TS data; host-backed TS remains
work to do. Previous throughput snapshots do not measure the new Intl adapter.

## Compact calendar default

The default TS entry uses compact ICU4X Chinese/Dangi tables for 1900–2102 and
an exact BigInt port of ICU4X 2.3.0's arithmetic approximation outside that range.
The historical tables cover the specified authority ranges and extend through
2102 so the approximation rejoins continuously. This replaces full-range packs
without relying on older host Chinese calendar calculations or their extreme-date
failures. Source attribution and Unicode-3.0 licensing ship in LICENSE.md.

Umm al-Qura uses captured host Intl in AH 1300–1600 and the existing civil fallback
outside that range. Year lookup caches at most 128 years. Month addition and
differences use direct mean-lunation serials, verified against every packed month. All IANA timezone data is still bundled.
`standalone.js` retains the previous full-table calendar engines and supports
calendar/named-zone operations with Intl absent. Public installation targets the
default namespace. The standalone and default entries share the native backend
module, but their constructor brands remain separate.

The numeric range verifier checks all 1,204,680 years and 14,899,816 months against
the existing full ICU4X packs, including month codes and end-of-month conversion
within internal ±110-million-day coordinates. This checks port equivalence,
not independent astronomical truth. The independent ICU/HKO/KASI corpus now
passes all 30,620 rows, including 937 bridge cases, with no exclusions or accepted
failures. Hermes runs that corpus in source and optimized bytecode with native
Intl data available and no Rust Temporal backend enabled.

The previous host-only profile matched the reference's 206 failing rows. Those
failures are fixed in the compact engine; the reference remains a diagnostic
control. Older size snapshots remain historical. Current matched size and
throughput evidence is recorded separately after the default switch.

Eleven count-checked compact-profile Test262 scopes cover eight classes,
calendars, Now and installation. They use the same full corpus selections and
zero-failure baselines as the existing WASM scopes. No implementation failures
are reclassified as host exclusions. Legacy Intl clipping/lunisolar formatting
and the Rust API/capability audit remain separate completion requirements.
DurationFormat integration now has the additional gates below.

Final validation: 39 focused regression targets pass and all three actual
TypeScript checker outputs are empty. The compact profile passes 12,228
count-checked executions (9,090 class, 2,974 calendar, 138 Now, 26 installation).
The full-range test also verifies every month serial and each year's final-month
inverse; large three-million-month additions match standalone without scanning
intervening years. Impossible four-billion-month additions reject immediately.

Fresh snapshots: `compact-calendar-size-results.json`,
`compact-calendar-backend-size-results.json`, and
`wasm-compact-calendar-results.json` under benchmarks/temporal. Published consumer
bundles measure 93,005 bytes gzip for default and 361,912 for standalone, a 74.3%
reduction. The raw-source Rolldown profiles measure 92,044/361,121; these are a
separate bundling path. Separately compressed runtime graphs measure TS 95,277,
native-data WASM 474,427, and retained-fallback WASM 537,658 bytes gzip. Neither
measurement is an npm archive size. WASM binary alone remains 441,577 bytes gzip.

The 43 ISO public-operation workloads retain checksum 173601476. Both WASM modes
lose to TS on every measured Node median; this does not establish non-ISO speed.
Parsing medians are TS 1.636 µs, native-data WASM 3.250 µs, reference 3.008 µs.
Field getters remain slower than the reference: TS 2.489 µs versus 0.437 µs.
Previous Hermes throughput snapshots predate this default switch; the current
Hermes claim is source/bytecode conformance, not refreshed throughput or startup.

## Compact timezone default

Default and standalone now use `tz/temporal-compact.js`; the numeric kernel and
future-rule interpretation are unchanged. Identifier/primary metadata is loaded
separately from history decoding. Decoding stays lazy per concrete zone.
DateTimeFormat sets the compact-timezone flag false to reuse its existing data;
native-only builds discard both TS representations. No host offset/future-rule
mixing is introduced.

The 12,228 count-checked default executions pass. Independent Hermes timezone
checks cover the complete offset, transition, ambiguity and identity corpora in
source and optimized bytecode. Published package tests include the no-Intl
standalone and both WASM profiles; DateTimeFormat timezone/formatter controls pass.

Current consumer bundles measure 64,645 bytes gzip for default and 333,124 for
standalone. Default drops 30.5% from the prior 93,005-byte profile. The full
host-backed reference remains 23,226 bytes; data policies still differ. Native-data
WASM measures 473,973 bytes including its unchanged 441,577-byte gzip binary.
Fresh 43-workload Node measurements retain checksum 173601476; neither WASM
profile beats TS on a measured median. See the compact-timezone snapshots under
benchmarks/temporal for module graphs, all timings and limits. Remaining Intl,
Rust API and cold-load audits still prevent a full completion claim.

## DurationFormat integration

Shared duration conversion now accepts late namespace registration and captures
parsers/private-slot getters per constructor. Owned DurationFormat exposes a
registration hook; Temporal installation also adapts legacy host format methods.
Receiver validation precedes input conversion. Ordinary records keep their
specified property-read order. Native Hermes retains its direct formatter and
now checks registration identity before reading mutable parser properties.

All six Temporal DurationFormat files pass twelve executions per profile across
four Node profiles (host/owned formatter, TS/WASM) and Hermes TS/SDK in source and
optimized bytecode: 96 executions, no exclusions. Separate source/bytecode tests
verify repeated registration after poisoning parser accessors and prototype
getters. Published-package tests use independently bundled default/standalone
namespaces, owned/native formatters and pre-existing formatter instances.

The owned formatter's full 220-execution suite passes. Comparing 208 non-Temporal
host executions before/after installation adds no failures; four existing native
diagnostics remain. Existing independent ICU scalar/plain/zoned duration controls
pass on Node and Hermes source/bytecode. Those are arithmetic controls, not a new
ICU localized-duration rendering oracle. Full Duration and installation gates,
package boundaries and actual TypeScript checkers pass.

The TS namespace module graph remains 66,933 bytes gzip. Native-data WASM glue
and its unchanged binary measure 475,345 bytes gzip when compressed separately;
the prior compact-timezone graph was 474,202. Installer/formatter paths changed;
no fresh hot-operation performance claim. Size evidence is recorded in
`benchmarks/temporal/durationformat-integration-size-results.json`.

## Extended Gregorian host formatting

Legacy Gregorian/ISO plain formatting now handles civil dates beyond Date's
clipping boundary. A 400-year cycle preserves month, day, weekday and clock
fields; captured NumberFormat restores full localized years. Two-digit years
are unchanged. Range endpoints share a shift when it fits without crossing an
era, preserving interval field sharing; otherwise widely separated boundary
endpoints shift independently. Ordinary Date/Number inputs still clip.

All 18 clipping-specific Test262 executions pass on Node TS/WASM and Hermes
source/optimized bytecode. The Hermes fixture removes only the private direct
Temporal formatter bridge to exercise the legacy adapter with native formatter
primitives. Independent ICU4J 79.1 proleptic Gregorian fields cover 360 single
cases and 80 ranges across five numeral systems and both Gregorian identifiers,
including era boundaries, equal ranges and possible surrogate-year collisions.
Normal ICU style-field and native behavior-preservation controls also pass.

This layer passed 128/130 strict legacy DateTimeFormat executions. The subsequent
lunar formatter correction above closes the two host calendar-data mismatches,
without exclusions.
Non-Gregorian extended host formatting remains open. The refreshed full owned
Intl diagnostic has 4,080 executions and the same four pinned timezone/CLDR
assumption differences; the raw exact ICU locale-string check still exposes
host literal differences such as Russian space versus narrow no-break space.

This layer's consumers measured 65,121/334,194 bytes gzip for default/standalone.
Separately compressed graphs measure TS 67,389, native-data WASM 475,835 and
hybrid WASM 509,770 including the unchanged WASM binary. New snapshots are
`extended-date-size-results.json` and `extended-date-backend-size-results.json`.
No new throughput claim.

## Numeric lunar boundary and full-corpus refresh

Numeric Chinese/Dangi formatting now survives host ICU failures near valid Date
limits. Safe-year label patterns retain relatedYear/yearName; correction preserves
the original local day, clock and timezone. Reversed ranges reject before fallback.
Shared controls cover 24 boundary/calendar/timezone combinations on TS, both WASM
entries and Hermes source/HBC. Hermes retains 936 independent ICU-era checks per
mode; extreme lunar checks assert field consistency, not independent astronomy.

Final post-fix run passes 53 targets: 44 complete namespace, six full Intl
compatibility and three numeric boundary gates. The 73,368 Test262 suite executions
overlap; each profile's union has 13,324 scenarios with two documented data
exclusions. Node class and Intl gates use different formatter providers. A separate
host-Intl raw diagnostic passes 4,078/4,080; only the stale CST6CDT alias assertion
fails. All 62 normalized Rust operations succeed under both WASM profiles: 58
through public methods, four lower-level adapters checked against ICU fixtures.

The three `benchmarks/temporal/lunar-boundary-*-results.json` snapshots refresh
current Node throughput and sizes. Separate module graphs measure 70,443 bytes
gzip for TS and 481,746 for native-data WASM including binary. The full reference
bundle uses host Intl and measures 23,226. Both WASM profiles trail TS on all 43
measured ISO medians. Host Intl is allowed; shipping owned timezone data is optional.

Completion remains open. Older host rules format Havana one hour behind owned
ZonedDateTime fields after the 2026 rule change. The typed Rust PlainDate API also
needs direct omitted-time zoned conversion using existing day-boundary semantics.
See 015a for exact evidence scopes and remaining requirements.

## Rust PlainDate zoned conversion

`PlainDate::to_zoned_date_time(zone, time)` now consumes a timezone provider and
retains the calendar. Omitted time shares ZonedDateTime's civil-day boundary
algorithm; explicit time uses compatible resolution. Providers need not implement
Clone. A cross-midnight 24-hour gap distinguishes earliest-day conversion from
resolving midnight and then taking that result's start of day. Controls include
5,292 independent ICU day boundaries, Apia's skipped date and exact Instant bounds.

All twelve focused Rust/WASM/Hermes regression targets pass, including 7,216 zoned
Test262 executions across four profiles. `rust-date-zoned-backend-size-results.json`
refreshes sizes: TS remains 70,443 bytes gzip; native-data WASM totals 481,666,
including its 443,098-byte binary. This is a size refresh, not a new timing run.

## Host timezone formatting consistency

Legacy ZonedDateTime locale formatting now compares captured host offsets with
owned local fields. Stale rules or absent host identifiers use a UTC projection
of owned local time and localized numeric offset labels. Matching host offsets
retain native output. A shared offset-reader leaf avoids bundling the unused host
resolution prototype. No generated timezone or locale data changes.

Controls cover eight independent ICU rows, four locales, five option/style
patterns, historical second offsets, negative fractional milliseconds and local
dates beyond Date TimeClip. All 171 cases run before/after installation through
normal/stale TS and both WASM entries, plus Hermes source/HBC. Host GMT patterns
retain locale signs, separators and the host's numbering policy.

The broader non-Temporal native-behavior check also found the preceding reverse
range guard was incorrect: ECMA-402 permits reversed endpoints. Remove it; verify
both endpoint source fields in the existing lunar boundary corpus.

Final size snapshot: `benchmarks/temporal/host-timezone-formatting-size-results.json`.
TS/native-data WASM module graphs measure 72,018/482,767 bytes gzip, including the
unchanged 443,098-byte binary for WASM. No new timing claim.

## Startup and current Hermes measurements

The cold-process benchmark is `//benchmarks/temporal:startup_benchmark`. It checks
matched outputs in fresh Node processes, disables persistent compilation caches
and records import, WASM setup, first operations and process memory separately.
`completion-startup-results.json` records nine samples per profile. Filesystem
caches remain warm; no network or browser-load claim is made.

`completion-hermes-results.json` refreshes 43 ISO workloads for compact default TS,
the normalized Rust bridge and the installed SDK in source and optimized HBC.
All output/checksum checks pass. See 015a for counts and measurement limits.

## Default installed Intl timezone provider

Default TS now queries captured installed DateTimeFormat for named timezone
offsets, gap/fold resolution and next/previous transitions. Native Intl or
FormatJS polyfills are accepted; install them before importing Temporal. UTC and
numeric offsets stay data-free. No formatter package import or runtime cycle.
Standalone, Rust WASM and Hermes SDK retain owned IANA histories/future rules.
Verified compact Chinese/Dangi arithmetic stays: raw host delegation exposed
pinned data mismatches and did not remove its fallback engine.

A separate generated `tz/temporal-names.js` contains identifiers and per-zone
sampling intervals, without offsets or transition histories. Generator chooses
at most half the minimum finite offset-transition spacing, capped at 60 days,
and includes a full Gregorian future-rule cycle after the finite record.
Abbreviation-only events do not shorten intervals. Existing DateTimeFormat data
outputs are unchanged; no locale data grows. Refresh intervals with IANA data.
Host data versions can still differ from generator data.

Intl provides no transition enumeration. Runtime samples offsets, then binary
searches changed intervals to the exact second. Searches start at 1800; next
search ends three years beyond the later of now/input. Far-future previous
searches probe nearby years before resuming finite history. This assumes future
rules recur annually or settle at a fixed offset. It is a search policy, not an
Intl guarantee; standalone retains exact owned finite events and future rules.
Nanosecond strictness and instant bounds remain covered.

All 52 affected gates pass. Exact report unions retain Node 13,474 and Hermes
source/HBC 13,472 passing scenarios each, with unchanged data-version exclusions.
Independent Hermes ICU controls check 17,640 offsets and 1,900 gap/fold windows,
including next/previous transitions. Owned 171-case stale/missing-host formatting
controls explicitly use standalone; default separately follows installed Intl.
See `packages/temporal/host-intl-default-audit-results.json` for report hashes.

`host-intl-default-startup-results.json` records nine fresh Node processes per
profile. Default gzip falls 69,657 to 38,639 bytes (44.5%); standalone 339,338;
full reference 23,083. Native-data WASM totals 479,583, hybrid 484,339, including
443,098 binary bytes. Ready medians: TS 20.84 ms versus full reference 22.58;
previous owned-data TS 12.11. Payload shrinks; startup work increases in this
sample. Earlier throughput snapshots are historical, not remeasured claims.

## WASM bridge cost diagnosis (before binary records, 2026-11-17)

`//benchmarks/temporal:wasm_cost_benchmark` isolates matched public ISO calls,
counts normalized requests, replays exact recorded Rust responses, and compares
production JSON transfer with preallocated storage and a benchmark-only numeric
calendar ABI. Forward/reverse snapshots and methodology live in
`benchmarks/temporal/README.md` under "WASM bridge cost diagnosis".

Eight PlainDate getters cost TS 2.64 microseconds versus WASM 47.05. They send
13 logical queries (eight identical date conversions), each requiring six
exported-function crossings plus JSON/UTF-8 and allocation work. Replay still
costs 12.81 microseconds because JS normalization/serialization remains. Instant
formatting sends separate round/format requests; addition sends ten duration
fields twice for validation then addition.

One calendar conversion costs 2.83 microseconds through the string bridge,
1.91 with preallocated input/descriptor and no text transfer, 0.36 through a
numeric ABI including equivalent JSON reconstruction in JS, or 0.074 for the
numeric call and field reads. Numeric control uses the production ISO calendar
provider but omits textual dispatch/general ABI validation; it is not a full
polyfill alternative. Reverse timing order preserves the conclusion. The actual
wasm32 Rust core is already built at opt-level 3; the final export shim uses z.

The measured pre-change slowdown comes from fine-grained normalized JSON calls and repeated
work around small calculations. Prioritize fewer queries, typed records/reused
buffers and fused backend operations, preserving observable coercion/error
ordering. Existing claims cover Node/V8 ISO workloads, not all calendars or
engines. TS stays default; the diagnostic snapshots predate the binary-record implementation below.

## Whole WASM operations and binary results (2026-11-17)

ABI 10 adds module-owned reusable input/output buffers. Each normal request
uses one exchange export; buffer growth reserves separately. Operation/key IDs,
packed calendar snapshots and numeric duration fields avoid JSON text transfer.
Rust still uses dynamic normalized records internally. JSON controls remain for
the native SDK and independent diagnostics.

Rust returns immutable calendar/clock/zone snapshots with parsed or computed
date-like values. Getters reuse those snapshots; backend replacement invalidates
cached owners. Optional derived-field failures remain lazy getter errors.
Instant rounding/offset/formatting and date-like partial updates execute whole
Rust operations. JS retains observable field reads, coercion, options, brands,
object creation and cheap boundary checks. Native-data builds prune TS fallback
arithmetic; default/hybrid retain it. Backend metadata continues to report
`completeTemporalBackend: false`.

Package regressions assert one exchange per date add/partial update, zero
additional getter exchanges, shared-instance buffer growth recovery, matching
operation dictionaries and TypeError precedence for incomplete era fields.
Rust tests cover malformed/truncated requests, invalid operations, range errors
and recovery. Existing ICU oracle corpora and Test262 exclusions remain unchanged.
The facade/startup harnesses also compare pinned `@js-temporal/polyfill` 0.5.1
(dev-only), alongside `temporal-polyfill` 1.0.7.

Full-result benchmarks also exposed repeated timezone candidates: each historical
transition retried its offset, even when centuries reused the same two values.
`TransitionZone::visit_offsets` now remembers sixteen offsets on the stack;
additional values still reach the visitor. No heap cache or new data is needed.
Rust regression controls cover 400 repeated transitions and forty distinct
offsets. Existing ICU gap/fold and day-boundary controls verify behavior.

Final evidence: `benchmarks/temporal/binary-operation-results.json` (48 workloads)
and `binary-operation-startup-results.json` (nine fresh processes per profile).
All 55 focused targets pass. WASM and SDK Hermes source/bytecode each execute
12,234 Test262 scenarios; exclusion manifests are unchanged. WASM wins 4/48
against TS, 18/48 against official reference. Node namespace gzip: TS 39,693;
native-data WASM 487,770 (29,560 JS, 458,210 binary); official 44,522. Shared
ISO/timezone readiness medians: 19.50/24.23/26.75 ms respectively. Eager snapshots
move work into constructors/arithmetic; warm getters are not an end-to-end win.
Official 0.5.1 Chinese month addition throws `Unexpected leap month suffix: Mo1`
on pinned ICU 78.2; its optional calendar startup sample is explicitly disabled.

## Typed WASM hillclimb (2026-11-17)

ABI 11 keeps the same 69 operations and adds fixed requests for Instant
parse/add/format, the three date-only parsers, and PlainDate addition. Instant
nanoseconds cross as signed 128-bit little-endian integers; duration components
remain validated numeric fields. Instant formatting writes directly into the
reused output buffer. JS retains observable coercion, option and brand checks.
Runtimes without DataView BigInt methods retain the generic Instant adapter.
The JSON SDK/control protocol keeps its prior result shapes.

Calendar, clock and zone snapshots now use a fixed Rust array plus error mask.
The SDK serializes that shared calculation when explicitly requested; WASM
encodes the fields directly. Constructors/arithmetic still return complete
snapshots, including individual deferred getter errors. No calendar or timezone
data changes. ABI 10 binaries must be replaced with the matching ABI 11 binary.

The hillclimb first bypassed Rust's dynamic Instant request maps, then removed
JS request objects and decimal BigInt transfers. Fixed snapshots removed the
next allocation bottleneck; typed date requests followed. Bound generic JS
intrinsics showed no useful gain. A fixed-shape JS snapshot decoder regressed
parse/add and was discarded. These are local Node/V8 observations; Hermes
source/bytecode conformance remains a separate correctness requirement.

Wider PR CI caught two regressions outside the initial 55 focused gates:
cached `.offset` strings incorrectly reused the minute-rounded formatter, and
non-ISO MonthDay `.with({month})` returned RangeError instead of TypeError.
Snapshots now preserve offset seconds/fractions; string serialization still
uses its required minute rounding. The JS adapter checks missing monthCode/year
before the Rust request. Public package regressions and the unchanged Intl
Test262 selections cover both. Three historical oracle fault-injection checks
now target fused snapshot routes instead of removed redundant getter/validation
calls. No exclusions were added.

Final hillclimb evidence: `benchmarks/temporal/hillclimb-results.json` (48 matched
workloads), `hillclimb-startup-results.json` (nine fresh processes/profile), and
`hillclimb-experiments.json` (kept/discarded iterations). All 62 final targets
pass, including every failed PR CI target. WASM wins 5/48 against TS,
20/48 against official reference. Native-data namespace consumer:
493,058 gzip bytes; shared ISO/timezone readiness 24.44 ms.

## CPU-profiled WASM follow-up (2026-11-17)

V8 CPU profiles identify JS duration coercion/validation, recursive result decoding,
Rust dynamic maps and generic formatting as separate costs. The optimized profiling
build retains WASM names with `--define=temporal_wasm_profile=true`; production
still strips names. `benchmarks/temporal/profile-results.json` records weighted
self samples from the ABI 11 baseline. Inspector bookkeeping is excluded; setup,
warmup, runtime helpers and GC remain explicit. Profile-mode timings are not
throughput claims.

ABI 12 has typed variants for fifteen existing operations. ISO field construction
and date/short-date updates call the typed public Rust methods directly; non-ISO
paths remain supported. Complete ISO date records use a fixed layout. Getters
reuse their owner-stamped snapshots without a redundant WeakMap entry. JS retains
coercion/read order; non-Instant duration paths still validate before options
getters. Rust remains the arithmetic authority. Instant formatting writes ASCII
to a bounded stack buffer before one output write.

Extra spec controls caught a Rust generic-adapter failure absent from the pinned
Test262 selection: finite month/day fields above Number.MAX_SAFE_INTEGER were
rejected before [overflow correction](https://tc39.es/proposal-temporal/#sec-temporal-regulateisodate). TS already handled them. Shared Rust numeric
conversion now clamps before narrowing and still rejects non-finite or fractional
numbers. The controls run alongside public ICU oracles on TS, both WASM profiles
and Hermes; they do not inflate independent ICU row counts. A separate poisoned
Array iterator regression prevents new observable iteration during duration reads.
No new Test262 exclusions.

Pure TS executable code remains equivalent to the baseline after local identifier
renaming. `benchmarks/temporal/ts-regression-guard.json` records consumer hashes and
scope-normalized AST hashes, including all 2,560 lexical bindings. No TS math or
data changes were used to improve the WASM comparison.

The ongoing hillclimb uses isolated warmed processes for TS, native-data WASM and
both pinned references. `profile-hillclimb-results.json` retains all 48 public
workloads; `profile-startup-results.json` retains nine fresh startup processes per
profile. TS/references are unchanged from the preceding isolated run; WASM was
retimed after the numeric fix. Hybrid throughput is omitted in this snapshot;
shipping-size/startup controls still include it. Median wins do not establish
stable wins for close workloads. WASM remains slower overall; this goal is open.

ISO calendar resolution bypasses the compiled table registry. First non-ISO use
still initializes and validates table data. The fresh-process startup experiment
in `benchmarks/temporal/lazy-calendar-startup-results.json` reduces native-data
WASM ISO/timezone readiness from 25.0 ms to 16.3 ms (TS: 19.5 ms). Full calendar
readiness remains about 27 ms; table work is deferred, not removed.

### Direct DateTime bindings

ABI 13 adds typed PlainDateTime parse, add/subtract, round and format requests.
Complete ISO results use 48 bytes: signed i128 nanoseconds, the complete date
record, and six clock fields. Non-ISO snapshots retain the general representation
and deferred getter errors. JS still owns observable coercion and options order;
Rust public methods validate all arithmetic and formatting. SDK JSON shapes stay
unchanged. Instant and PlainDateTime reuse one bounded ASCII formatter.

`benchmarks/temporal/date-time-hillclimb-results.json` retimes all 48 WASM workloads
with the prior isolated warmup/sample counts. TS and pinned references come from
the earlier unchanged controls; these are explicitly identified in the report.

Final decoder controls reproduce and prevent inherited clock setters and absent
ISO era getters. Compact snapshots initialize own fields directly. Eleven focused
Rust/type/WASM/Test262/Hermes targets passed, then both WASM package/ICU suites and
DateTime Test262 passed after the decoder fixes. The pure TS AST still matches the
872fdaee baseline after local identifier renaming. Current medians win 16/48 against
TS, 20/48 against temporal-polyfill and 31/48 against @js-temporal/polyfill. The goal
remains open; DateTime parsing is nearly tied and round+format remains slower.

### Typed clocks and native slot representation

ABI 14 has typed variants for 26 existing operations. Complete clock records use
18 bytes, including exact Number nanoseconds and six Rust-computed fields. Native
clock slots use one WeakMap; getTimeSlot converts lazily to BigInt for existing
DateTime/Zoned/Intl callers. Pure TS retains direct BigInt slots. Clock fields have
no calendar/timezone data dependency. A u64 Rust storage trial was discarded after
isolated ABBA measurements; i128 APIs/storage remain. Bounded clock conversions
and quotient/remainder operands narrow safely; rounding results and fallback stay
wide. Signed-boundary controls cover ties and results crossing i64 limits.

Rust Duration::new rounds fields to Number-representable integers before sign,
calendar-unit and magnitude validation. Returned duration fields can therefore be
wrapped directly. Current trusted construction is used for native Time.until;
user-input construction keeps its validation. Typed duration formatting also
avoids generic maps. SDK JSON responses remain stable unless clockSnapshot is
requested. The adapter supports older SDK responses, including balancing the
legacy 24-hour rounding carry. Public regression controls cover captured WeakMap
lookups and results surviving WASM memory growth. No new exclusions.

The current isolated run refreshes TS/WASM and retains explicitly unchanged
pinned references. See benchmarks/temporal/time-*.json for throughput, startup,
size, profiles and retained/rejected experiments. All five clock workloads beat
TS; overall performance remains incomplete. The checked-in Bazel AST audit
normalizes local bindings and strips parser metadata while retaining executable
structure/global/property/literal semantics. It catches an unintended retained
intrinsic capture; existing captures retain their timing. The final TS audit
matches the 872fdaee baseline.

### Compact Instant transport

ABI 15 keeps the 69 normalized operations and adds compact signed integer results:
tag 15 plus i64 (9 bytes), or tag 10 plus i128 (17 bytes). Typed parse/add/round
use this representation. An optional scalar i64 rounding export returns BigInt
without refreshing WASM memory or decoding response records. i64::MIN requests
the checked buffer route for errors, wide results and the reserved value itself.
Capability probing supports engines without JS/WASM i64 interop. Rust validates
and rounds through its public Instant API; all public timestamp/result limits
remain wide. Failed scalar attempts do not increment successful-call statistics.

Native-only Instant construction wraps validated Rust outputs or existing private
branded values without duplicate range checks. Numeric user inputs retain checks;
JS coercion and option access ordering remain unchanged. The default TS executable
AST must still match the independent baseline. No new Test262 exclusions.

`benchmarks/temporal/instant-profile-results.json` records the prior rounding
profile. JS construction, GC and transport dominate Rust arithmetic. Alternating
pointer/direct/direct/pointer measurements support direct scalar results;
`instant-experiments.json` records intermediate trials and rejected native-width
increment validation. Short shared-process wins do not establish isolated wins.

The final isolated 48-workload snapshot records WASM wins in 24/48 against TS,
25/48 against the basic reference and 36/48 against the official reference. Rounding wins this snapshot but
loses longer isolated controls; it is not a stable win. Native namespace gzip is
500,581 bytes (+488); TS is unchanged at 39,690. Nine-process ISO/timezone readiness
is 16.85 ms versus TS 19.39 ms, with full native calendars at 27.47 ms. See
instant-hillclimb-results.json and instant-startup-results.json. The unchanged
executable TS AST passes the Bazel guard and its intrinsic-capture negative control.

All 63 focused Rust/TS/WASM/ICU/Hermes targets pass after the Instant changes,
including public types, scalar fallback and signed/full-range controls. Full
owned-Intl WASM conformance remains a CI gate. No new exclusions.

### Typed timezone transitions

ABI 16 keeps the 69 normalized operations and adds the 27th typed route. A request
carries signed i128 nanoseconds, direction and UTF-8 identifier; results are null
or compact/wide signed integers. The adapter avoids maps and decimal conversion.
SDK JSON fallback stays available. Public JS option/coercion order is unchanged.

FutureRule transition validation computes before/after states from one set of
recurring events. January 1 retains distinct rule-year windows. The first footer
second still compares with the explicit offset before it. Core remains no_std;
no cache, dependency or generated-data change. Public controls cover those joins,
strict nanosecond boundaries, both directions, UTC/fixed zones, full timestamp
limits, nulls and recovery after malformed requests.

See benchmarks/temporal/zoned-*.json for baseline profiles, diagnostic trials,
isolated full-workload timings and nine-process startup/size. Transition median
falls from 4.535 to 1.515 microseconds; TS is 0.459. Overall sampled WASM wins:
23/48 against TS, 25/48 basic reference, 35/48 official reference. Close medians
vary; the goal remains open. Default TS executable AST matches baseline. Node
namespace gzip rises 5,451 bytes to 506,032; ISO/timezone readiness is 16.61 ms,
full calendar readiness 27.29 ms. No new exclusions.

All 12 focused Rust/WASM Test262/ICU/Hermes/type targets pass for ABI 16;
validation targets are recorded in zoned-experiments.json. Broader conformance
remains a CI gate. No new exclusions.

### Typed zoned parsing and resolution

ABI 17 specializes two more existing operations, for 29 typed routes among the
unchanged 69 normalized operations. Parsed fields include Rust-computed local
nanoseconds and successful timezone identity metadata. Invalid calendar/zone
validation still precedes JS option getters. Invalid zone metadata is omitted,
so the original JS validation/error ordering remains authoritative. Calendar
annotations stay raw until JS validates them. Alias spellings remain preserved.

Typed resolution passes the already-created Rust ZonedDateTime into the shared
snapshot builder. ISO results carry signed instant/local nanoseconds, complete
calendar/clock fields, exact offset text/nanoseconds and hoursInDay. Non-ISO or
partially invalid snapshots retain their general encoding and deferred errors.
SDK JSON responses keep their existing shape; the shared offset formatter is
unchanged. No operation-result cache or data-policy change.

Boundary controls exercise full-range signed values, fractional/historical
offsets, optional versus supplied-empty offsets, invalid modes/UTF8/trailing
bytes and recovery. Public controls check complete ISO/Gregorian getters without
extra calls, alias spelling, poisoned Array iteration and option getter order.
Twelve focused Rust/WASM Test262/ICU/Hermes/type targets pass; no new exclusions.

`benchmarks/temporal/zoned-parse-*.json` retain incremental trials, all 48 isolated
TS/WASM timings, nine-process startup/size and the fresh named-WASM profile.
Parsing falls from 27.256 to 9.907 microseconds; TS is 3.969. Complete Rust results
stay eager while the public parse workload consumes only epochNanoseconds.
WASM wins 24/48 medians; slower operations are explicitly listed in the experiment
record. Pure TS executable AST still matches the baseline. Native namespace is
509,609 gzip bytes (+3,577), versus TS 39,692 using host Intl. ISO/timezone startup
is 17.01 versus 19.39 ms. Rust profile self time now concentrates on recurring
rule events and historical-offset scans; these are next targets. Goal open.

### Bounded timezone offset candidates

The Rust TimeZone provider adds default `visit_offsets_at(local, visitor)`;
custom providers retain full-history visitation. TransitionZone validates every
offset strictly within one day. Every valid candidate instant or transition producing a containing gap/fold
therefore lies within local plus/minus one day.
Two binary searches select that explicit-history window, including its entering
offset. Recurring standard/daylight offsets are included when the window reaches
the footer; timestamp bounds and the explicit/footer join remain covered.
NamedTimeZone/ResolvedTimeZone forward the method. `visit_offsets` is unchanged.
Both possible-instant enumeration and gap resolution use the optional local
visitor. Deduplication remains bounded stack storage with lossless overflow.

Monthly future events use Gregorian month lengths instead of converting the next
month. Day/Julian events still compute Jan 1. Future offsets extract only the year
from floor-divided signed seconds; all valid Instant seconds fit i64. Adjacent-year
windows and event/tie order remain unchanged. ABI 17, 69 normalized operations,
29 typed routes and complete Rust snapshots stay unchanged. No new data/cache,
dependency or TS source change.

A public-resolution differential control compares bounded lookup with a provider
using the full-history default across dense transitions, near-day offsets, gaps,
folds, footer joins, signed nanoseconds and timestamp bounds. Literal February
last-weekday controls distinguish common and leap years. Independent ICU and
Test262 remain conformance authorities.

All 63 focused targets pass against byte-identical final formatted Rust sources.
`benchmarks/temporal/bounded-zone-*.json` retain trials, separate profiles, all 48
isolated workloads, longer Instant rounding controls and nine-process startup.
Parsing falls from 9.907 to 7.235 microseconds; TS is 3.905. Current medians win
23/48 against TS, with all 25 slower cases inventoried. Longer Instant rounding
still loses (0.653 versus TS 0.601). Pure TS/native JS bundles are byte-identical
to the prior checkpoint. Native namespace is 507,887 gzip bytes, down 1,722;
raw WASM grows 318 bytes. ISO/timezone startup is 16.96 versus TS 19.48 ms.
Zoned rounding's generic decoder/writer remains a measured next target.
All-workload goal stays open.

### Direct zoned operations and complete ISO records

ABI 18 adds typed addZonedDateTime, roundZonedDateTime and startOfZonedDay requests:
32 typed routes, unchanged 69 normalized operations. Each resolves its input once,
calls the public Rust method and encodes its complete result. ISO records are
built directly on the stack, preserving date/week/clock fields, local/instant
nanoseconds, exact offset text/nanoseconds and day length. Non-ISO and deferred
getter errors retain general snapshots. Existing exact offset formatting is shared;
SDK JSON shapes and all data/dependencies remain unchanged.

Local resolution now accepts validated nanoseconds privately. Public field APIs
still call the same field/range validator; day boundaries use the same local range
check. PlainDateTime constructors replace an unused full ISO conversion with its
identical range check, keeping calendar validation. Offset-hint matching uses the
bounded local visitor, including the full-history custom-provider default.
Native-only zoned construction wraps Rust-result/private branded slots directly;
numeric user constructors stay checked, with the standard prototype and brands.

Alternating controls in zoned-operations-experiments.json support the raw-resolution
refactor and modest private construction gains. Rust prevalidation before options
added a boundary without a consistent gain and slowed DateTime addition; discarded.
Copied lazy snapshots and a separate flat JS decoder also lacked a consistent
matched gain; discarded. All complete Rust/JS result fields remain eager.
New controls compare every public ISO field with generic FFI snapshots at week/
year/BCE/range boundaries, retain results across memory growth, and verify prototype,
constructor/range checks, malformed request recovery, offset-hint policies and
poisoned Array iteration. No new conformance exclusions.

All 66 focused targets pass against recorded final source hashes; pure TS executable
AST still matches the independent baseline. `benchmarks/temporal/zoned-operations-*.json`
retain trials, three alternating controls, all 48 isolated workloads, nine-process
startup/size and fresh profiles. Zoned rounding falls from 11.415 to 3.870
microseconds; addition 15.134 to 5.834; day start 10.416 to 3.818. TS is 2.869,
6.243 and 2.075 respectively. Parsing is 6.339 versus TS 3.999. DateTime parsing
remains slower at 2.901 versus TS 2.470 and rose from its prior WASM measurement.
Current medians win 24/48; all 24 slower cases are inventoried. Goal open.
Native namespace grows 5,315 gzip bytes to 513,202, with unchanged data/dependencies;
ISO/timezone startup is 16.70 versus TS 19.40 ms. Duration parsing profile self time
is dominated by JS createDuration and generic decoding, making typed duration
transport/private Rust-result construction the next candidates.

## ABI 19 typed Duration transport

ABI 19 adds direct parsing, addition/subtraction and negation/absolute value: 35 typed routes, unchanged 69 normalized operations. Rust calls its existing public Duration APIs and returns all ten validated, Number-rounded fields in an 81-byte record. Native JS wraps private results without repeated duration validation or generic record decoding. Numeric constructors and user coercion retain their checks; cloning preserves fresh object identity and standard prototypes. SDK JSON shapes stay compatible.

Current ABI 19 isolated checkpoint: Duration parsing 1.19 µs versus TS 2.36; addition 3.77 versus 4.88. WASM wins 25/48 medians; 23 workloads still lose. All 66 focused Rust/TS/WASM/Test262/ICU/Hermes/provider targets pass. Default TS executable AST matches baseline. Native Node namespace is 513,908 gzip bytes (+706); TS 39,692, using host Intl. Native owns calendar/timezone data. ISO/timezone readiness: native 17.38 ms, TS 19.54 ms. Full native calendar readiness 27.99 ms.

Fresh sequential processes, eight varying inputs/parity, 20,000 warmup and nine samples of 50,000 calls per workload; transitions use 1,000 warmup and nine samples of 5,000. `duration-hillclimb-results.json` records all 48 current TS/native workloads. Pinned comparison timings are retained explicitly from the earlier Instant checkpoint, through zoned-operations-hillclimb-results.json. Median wins are not stable-win proof.

`duration-experiments.json` retains short diagnostics, exact validated source hashes, all 66 targets and every slower workload/ratio. Binary controls cover framing, UTF-8, invalid booleans, nonfinite fields and recovery. Public controls cover all fields, wide Number rounding, unbalanced units, positive zero, memory growth and clone/getter reuse. No data, dependency, cache or exclusion changes.

`duration-startup-results.json` uses nine fresh processes/profile with persistent compile cache disabled. Node namespace payload above differs from the browser export-all consumer in throughput JSON. Production WASM is stripped. `duration-profile-results.json` keeps named-WASM profiling separate from production size/timing claims. Default TS executable AST remains equivalent; intrinsic-capture negative control still rejected.

Fresh profiles leave YearMonth differences as a target: createDuration uses 19.54%
of sampled self time, generic decode 6.42% and decodeResult 2.85%. Typed difference
transport with trusted complete Duration wrapping can remove the same overhead.
Duration parse now wins; allocation still accounts for 25.05%, result decoding
10.46%. Duration addition includes its public formatting work. These samples do
not replace production timings. MonthDay parsing flips a marginal prior win back
to a loss; all 23 slower workloads stay explicit. Raw WASM grows 1,918 bytes;
TS browser gzip changes one byte from binding names, with identical executable AST.

## Typed differences

ABI 20 adds direct Instant, PlainDate, PlainDateTime and PlainYearMonth differences:
39 typed routes, unchanged 69 normalized operations. Requests carry signed 128-bit
nanoseconds or integral epoch days, both YearMonth calendars and rounding options.
Existing public Rust methods produce all ten validated Duration fields. Native JS
wraps results without generic decoding or repeated duration validation. Numeric
constructors, observable coercion/option order and SDK JSON shapes stay intact.

Current ABI 20 isolated checkpoint: YearMonth difference 3.29 µs versus TS 5.53; Date difference 3.54 versus 6.15; DateTime difference 4.10 versus 6.39; Instant difference 2.54 versus 2.50. Full matrix records 27/48 median wins; rounding win fails longer controls. All 21 raw slower workloads plus rounding remain unresolved. All 66 focused Rust/TS/WASM/Test262/ICU/Hermes/provider targets pass. Default TS executable AST matches baseline.

Native Node namespace is 516,007 gzip bytes (+2,099); TS 39,692, using host Intl. Native owns calendar/timezone data. ISO/timezone readiness: native 17.57 ms, TS 19.53 ms. Full native calendar readiness 28.21 ms. Raw WASM grows 9,249 bytes.

`differences-hillclimb-results.json` records all 48 current TS/native workloads in
fresh sequential processes, eight varying inputs/parity, 20,000 warmup and nine
samples of 50,000 calls; transitions use 1,000 warmup and nine samples of 5,000.
Pinned comparison throughput remains explicitly retained from the earlier Instant
checkpoint, through duration-hillclimb-results.json. Close median wins vary;
all slower workload ratios are listed in differences-experiments.json.

Raw controls compare public Rust methods across nine rounding modes, both signs,
until/since and date/time unit choices. They cover complete field records,
fractional/nonfinite days, signed nanosecond bounds, invalid calendars/UTF-8,
boolean/unit/mode framing, semantic errors and recovery. Public controls verify
one Rust request, every field, positive zero, standard prototype/constructor and
ownership after memory growth. No new data, cache, dependency or exclusions.

`differences-startup-results.json` uses nine fresh processes/profile with persistent
compile cache disabled. Node namespace payload above differs from browser
export-all consumer sizes in throughput JSON. Production WASM is stripped;
`differences-profile-results.json` keeps named-WASM profiles separate. Default TS
executable AST remains equivalent; intrinsic-capture negative control rejected.

Longer fresh TS/native/native/TS controls use 100,000 warmup and nine samples of
300,000 calls. Instant rounding is still slower: native 0.624/0.647 µs versus
TS 0.594/0.575. Its full-matrix median win is noisy and unproven. Instant difference
wins those controls at 2.474/2.486 versus TS 2.646/2.535, but loses the full matrix
at 2.538 versus TS 2.501. Keep it unresolved. The 27/48 raw median count is not a
stable-win claim: all 21 raw slower cases plus rounding remain explicit.

Fresh named-WASM profiles identify remaining overhead: zoned formatting spends
10.08% in generic write, 5.85% in Rust Reader.value and 4.45% in JS decodeResult.
DateTime round/format spends 10.02% in createPlainDateTime and 9.55% in
dateTimeResult. Instant difference retains allocation/formatting costs:
createNativeDuration 8.59%, formatDuration wrapper 8.67%, result decoding 5.45%.
Profiles guide the next changes; their timings/sizes are not production claims.

## Typed zoned formatting

ABI 21 adds direct zoned formatting: 40 typed routes, unchanged 69 operations.
Rust calls its public formatter and returns the complete string, preserving all
precision/rounding/annotation policies and offsets after rounding across DST.
Four plain date format requests reuse the existing interned calendar IDs with
strict UTF-8 fallback. No new strings, data or cache. Native DateTime construction
wraps private validated slots directly; complete snapshots stay eager. Bindings retain
the ISO epoch day already returned by Rust, removing JS BigInt division, a weak-map
lookup and a second private date-slot allocation. Numeric
constructors and observable JS option/coercion order remain checked. SDK JSON
stays compatible; pair WASM binary and JS adapter.

Current ABI 21 isolated checkpoint: zoned format 1.93 µs versus TS 2.10; DateTime parse 2.00 versus 2.40; DateTime round/format 2.50 versus 1.64. Full matrix records 31/48 median wins; 17 workloads remain slower. Close rounding/difference controls stay explicit; median count is not stable-win proof. All 66 focused Rust/TS/WASM/Test262/ICU/Hermes/provider targets pass. Default TS executable AST matches baseline.

Native Node namespace is 516,755 gzip bytes (+748); TS 39,692, using host Intl. Native owns calendar/timezone data. ISO/timezone readiness: native 17.39 ms, TS 19.60 ms. Full native calendar readiness 28.05 ms. Raw WASM grows 3,679 bytes.

`format-experiments.json` retains four shared-process diagnostic stages and four
alternating implementation controls. The private DateTime factory has modest rounding gains;
parsing overlaps in isolated controls, so its earlier shared-process win was not
stable proof. Longer trusted/checked/checked/trusted runs measure rounding
2.412/2.361 versus 2.509/2.493 µs. Calendar-ID controls keep the same trusted factory
and compare UTF-8/interned/interned/UTF-8: YearMonth format 0.606/0.581 versus
0.657/0.663 µs; MonthDay 0.582/0.560 versus 0.629/0.638. Neither short format is
assumed faster than TS from these controls.

Epoch-day reuse has separate derived/Rust/Rust/derived controls: DateTime parsing
1.844/1.848 versus 2.879/2.883 µs. Zoned formatting stays 1.788–1.801 across
variants. An intermediate parsing profile spent 17.12% in dateSlot and 14.43% in
GC; the old bindings discarded the Rust epoch day and rebuilt a second slot.
All complete Rust fields stay retained. Earlier factory-only parsing results
remain mixed; this control isolates the additional epoch-day change.

`format-hillclimb-results.json` records all 48 fresh sequential TS/native workloads,
eight varying inputs/parity, 20,000 warmup and nine samples of 50,000 calls;
transitions use 1,000 warmup and nine samples of 5,000. Pinned comparison throughput
remains explicitly retained from the earlier Instant checkpoint, through
differences-hillclimb-results.json. All slower workload ratios stay explicit.

Raw controls compare the public Rust zoned formatter across precisions, nine
rounding modes, annotation policies, DST gap/fold boundaries, historical/fixed
offsets, Hebrew and instant bounds. All compiled calendars compare compact and
UTF-8 plain format packets against public formatting. Invalid codes, UTF-8,
precision, identifiers, range and framing recover. Public controls cover exact
DST outputs, complete DateTime fields after memory growth, clones, prototypes and
numeric constructor bounds. No new conformance exclusions.

`format-startup-results.json` uses nine fresh processes/profile with persistent
compile cache disabled. Namespace sizes above differ from browser export-all
consumer sizes in throughput JSON. Production WASM is stripped; named-WASM
profiles in `format-profile-results.json` are separate from production claims.
Default TS executable AST remains equivalent; negative control stays rejected.

Current fresh TS/native/native/TS controls use 100,000 warmup and nine samples of
300,000 calls. DateTime parsing wins: native 1.821/1.833 µs versus TS 2.569/2.625.
Instant rounding remains slower: native 0.624/0.648 versus TS 0.597/0.581. Its
full-matrix median win is unproven. Instant difference remains mixed: native
2.507/2.572 versus TS 2.611/2.517, while full matrix loses at 2.521 versus TS
2.429. All 17 raw slower workloads plus rounding stay explicit. Raw 31/48 median
wins do not establish all-workload completion.

Final profiles retain named-WASM attribution separately from production timings.
DateTime parsing now spends 15.46% in NativePlainDateTime, 10.80% in dateTimeResult
and 10.34% in GC. The old dateSlot recomputation motivated epoch-day reuse; its
causal A/B controls are retained. DateTime round/format still spends 10.49% in
construction and 10.16% in result decoding. YearMonth format spends 9.55% in
Text.write_str, 6.20% in std fmt.write and 6.08% in each UTF-8 decoder frame.
These remaining allocation/formatting costs guide the next changes.

## Typed short-date operations

ABI 22 adds direct YearMonth addition/subtraction and YearMonth/MonthDay projection
to PlainDate: 43 typed routes, unchanged 69 normalized operations. Existing public
Rust methods do the math; the complete result includes all date/derived fields.
ISO results use a shared stack record instead of intermediate dynamic snapshots.
ISO field creation/updates and DateTime records share the date writer. Other
calendars and deferred getter errors retain existing representations. JS field/
option order, numeric checks, prototypes and SDK JSON remain intact.

Current ABI 22 isolated checkpoint: YearMonth add 2.99 µs versus TS 5.62; YearMonth projection 1.42 versus 2.39; MonthDay projection 2.21 versus 2.73; date field construction 1.50 versus 1.45. Full matrix records 34/48 median wins; 14 workloads remain slower. Close-workload controls stay explicit; median counts are not stable-win proof. All 66 focused Rust/TS/WASM/Test262/ICU/Hermes/provider targets pass. Default TS executable AST matches baseline.

Native Node namespace is 517,885 gzip bytes (+1,130); TS 39,692, using host Intl. Native owns calendar/timezone data. ISO/timezone readiness: native 17.62 ms, TS 19.50 ms. Full native calendar readiness 28.31 ms. Raw WASM changes +4,391 bytes.

`short-date-experiments.json` retains baseline profiles, both diagnostic stages,
full alternating controls and final source hashes. Generic/direct/direct/generic
ISO-record controls show YearMonth add 2.942/2.948 versus 3.146/3.175 µs;
YearMonth projection 1.610/1.610 versus 1.870/1.810; MonthDay projection
2.172/2.147 versus 2.355/2.370; date fields 1.443/1.308 versus 1.585/1.592.
An inline(always) experiment had no consistent benefit and was discarded.
Unrelated DateTime parse variation in these controls is not claimed as a gain.

`short-date-hillclimb-results.json` records all 48 fresh sequential TS/native
workloads, eight varying inputs/parity, 20,000 warmup and nine samples of 50,000;
transitions use 1,000 warmup and nine samples of 5,000. Pinned reference throughput
remains explicitly retained from the earlier Instant checkpoint, through
format-hillclimb-results.json. Every slower workload/ratio stays recorded.

All compiled calendars compare add/subtract and both projections with public Rust
methods; complete non-ISO records match the existing generic bridge. ISO fields
match public date properties; extended reference dates, BCE, bounds and week/year
boundaries match the generic oracle. Malformed flags, codes, UTF-8, numeric fields
and framing recover. Public tests verify exact outputs, one operation request,
standard prototypes and all getters across memory growth. No new exclusions.

`short-date-startup-results.json` uses nine fresh processes/profile, persistent
compile cache disabled. Namespace payload above differs from browser export-all
consumer sizes in throughput JSON. Production WASM is stripped; named-WASM
profiles in short-date-profile-results.json are separate from production claims.
Default TS executable AST remains equivalent; negative control still rejected.

Fresh TS/native/native/TS controls use 100,000 warmup and nine samples of 300,000
calls. MonthDay projection wins at 2.268/2.168 µs versus TS 2.692/2.593. Date field
construction nearly ties at 1.376/1.391 versus TS 1.392/1.421 but loses the full
matrix at 1.500 versus TS 1.450; unresolved. Instant difference also overlaps in
longer controls and loses the full matrix. Instant rounding remains slower:
0.622/0.619 versus TS 0.585/0.586, rejecting its raw median win. All 14 raw slower
workloads plus rounding remain explicit. Raw 34/48 medians are not stable-win proof.

Fresh profiles leave date field construction dominated by JS (63.50% self time),
with Rust 13.28% and GC 10.11%. createPlainDate is 19.46%, decodeISODate 10.46%.
A private trusted date factory looked faster in shared-process diagnostics but
had small/mixed isolated gains; discarded. Original checked PlainDate construction
stays intact. YearMonth add now spends 10.65% in construction and 8.28% in duration
preparation. Zoned updates retain generic decode/write costs (9.67%/4.75%), making
typed field updates a candidate. Profile timings/sizes are not production claims.

## Native Instant storage

Native-only Instant slots use private fields instead of WeakMap entries. Rust still
returns complete epoch nanoseconds. Public constructor coercion precedes exactly
one newTarget prototype lookup; subclass/clone/brand behavior stays intact. ABI 22,
43 typed routes, 69 operations and SDK JSON unchanged. No new exclusions.

Current native Instant storage checkpoint (ABI 22 unchanged): round 0.139 µs versus TS 0.475; parse 0.475 versus 1.578; add 0.787 versus 2.244. Full matrix records 36/48 raw median wins; 12 workloads remain slower. Close controls remain explicit; all-workload goal open. All 66 focused Rust/TS/WASM/Test262/ICU/Hermes/provider targets pass. Default TS executable bundle unchanged.

Native Node namespace is 518,004 gzip bytes (+119); TS 39,692, using host Intl. Rust binary unchanged. ISO/timezone readiness: native 17.64 ms, TS 19.53 ms. Full native calendar readiness 28.32 ms.

Evidence: `benchmarks/temporal/instant-storage-*.json`; benchmark README covers
profiles, alternating storage controls, close margins and fresh reference scope.
