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
PlainYearMonth, PlainMonthDay and ZonedDateTime. TS owns all 16 calendars
and IANA timezone data, including future recurring rules.
Conversions share private slots. ZonedDateTime supports construction, parsing,
fields, offset matching, all disambiguation modes, updates, arithmetic, rounding,
day boundaries, differences, transition queries and serialization. Calendar days follow local time; hours follow
elapsed time. Alias spelling survives separately from primary-zone equality.

Remaining work includes native Intl adaptation, complete Rust bindings and WASM
facade/data. No implementation gap is an allowed conformance exclusion.

## Validation

Initial per-class diagnostics below are historical. Later sections record newer
TS, Hermes source/bytecode and WASM gates. Intl integration still needs a complete
conformance audit. Strict selections cover supported families.
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
| ZonedDateTime  |             1,790 |                  1,800/1,804 |
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

The allocation-free no_std Rust core supplies Instant, Duration, clock,
calendar-aware plain date/date-time and zoned types, plus ISO short dates. Rust's TimeZone provider visits
all offsets; FixedOffset supplies constant zones. ICU transition records exercise
that boundary. TransitionZone borrows explicit IANA records and recurring footer rules; Rust
tests decode the owned JSON pack to exercise this provider. Production Rust
registry loading, calendar-aware short dates and native
Hermes bindings remain pending. Gap resolution walks indexed transitions;
multiple nearby changes need no isolated-gap assumption. The measured WASM build covers earlier matched Instant/Duration
primitives; a complete WASM facade remains pending.

[Completion plan](../../knowledge-base/015-temporal.md).
[Benchmark methods, measurements and limits](../../benchmarks/temporal/README.md).

Duration now supports relative totals, comparison and rounding against plain dates
or zoned values. Calendar anchors use the existing ISO/Hebrew engines; clock
remainders retain exact nanoseconds. Week rounding preserves larger calendar
prefixes. Totals round exact rational results once to binary64. Native Rust adds
plain/zoned total_duration, round_duration and compare_durations for ISO dates.

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

## Timezone identity

Named zones retain their case-regularized spelling. Equality uses separate primary
IDs: US/Eastern equals America/New_York; Africa/Accra differs from Africa/Abidjan.
Calendar-unit differences reject distinct primaries even when offsets match.
UTC aliases compare equal to UTC, separately from fixed +00:00.

Primary mappings combine pinned IANA Zone records, zone.tab country IDs and CLDR
preferred aliases. Raw Link targets do not determine identity. All 597 available
IDs and 178,503 identity pairs match independent ICU4J expectations in TS and Rust.
Rust exposes allocation-free identifier lookup and NamedTimeZone providers;
production IANA registry lookup is available; native Hermes installation remains pending.

Independent plain-relative ICU controls now run on Node, Hermes source/bytecode
and native Rust: 51,840 rounds, 17,280 totals, 20,736 date differences and 4,224
comparisons. Cases include month ends, BCE/year zero and wide years. Input clock
carry must remain within valid plain-date bounds before round/total; rounding
itself may produce a duration whose endpoint is outside that range.

The large plain ICU unit case has a 30-second aggregate timeout. Test262 keeps its
existing per-case limits; no additional exclusions.

Internal numeric kernel now covers 13 arithmetic calendars, including inverse
conversion, month codes, eras, checked addition and differences. Native formatter
providers and Rust Temporal share the Rust counterpart without formatter/data
runtime dependencies. Public TS types now expose these calendars through constructors, property bags,
fields, arithmetic and conversions. Chinese, Dangi and Umm al-Qura now use owned table engines below. No claim of complete calendar conformance yet.

Independent ICU controls add 34,366 field cases, 32,352 additions and 176 range
rejections on Node, Hermes source and optimized bytecode, and native Rust.
Hebrew uses ICU's trusted ±1000000 epoch-day range; Persian uses years 1206–1498.
Other proleptic ranges have separate conversion/addition/difference invariants.
ICU month/year boundary searches avoid negative-year length/reverse-setting bugs.
These oracle constraints add no Test262 exclusions.

## Arithmetic calendars

PlainDate, PlainDateTime, PlainYearMonth, PlainMonthDay and ZonedDateTime accept
ISO, Gregorian, Buddhist, Japanese, ROC, Coptic, Ethiopic, Amete Alem, Hebrew,
Indian, civil/tabular Islamic and Persian. `islamicc` normalizes to
`islamic-civil`; `ethiopic-amete-alem` normalizes to `ethioaa`.
Positional constructor fields stay ISO; property bags use their calendar.

```ts
const last = Temporal.PlainDate.from({
  calendar: 'coptic',
  year: 1739,
  monthCode: 'M13',
  day: 6,
})
last.add({days: 1}).monthCode // 'M01'
```

Era/eraYear pairs may replace year; inconsistent years reject. Era aliases and
signed/regnal years follow the [era/monthCode rules](https://tc39.es/proposal-intl-era-monthcode/).
Changing Hebrew years retains monthCode; MonthDay updates do not reuse the old
reference year. Branded conversions use internal calendar slots. ISO bags never
read era fields.

Unrounded differences compare month codes and days before constraining dates.
Jan 31 to Feb 29 is 29 days; rounding that difference to months gives one month.
Constrained addition and unrounded difference are not inverses. Shared plain/
zoned rounding retains the chosen quantum and bubbles only expanded boundaries.

An additional 2,344 strict Test262 executions per mode cover named arithmetic
calendar families. Complete Intl diagnostics retain all tests and remain failing.
Independent controls add 32,352 differences, plus public validation of 34,366
field cases, 32,352 additions, 176 bounds and 2,021 cross-class conversions.
Node and Hermes source/bytecode run these controls; Rust checks the same numeric
calendar differences through public date/date-time and zoned providers too.
Native short dates now retain all 16 calendars, including reference-date
canonicalization and calendar-span rounding. Hermes bindings and complete WASM
facade/data remain pending. See the [Rust API](../../crates/temporal/README.md#calendar-aware-public-types).

ICU month-end controls add 5,408 year/month total windows across 13 calendars,
checked through plain and UTC-zoned TS and Rust anchors. Native public
providers also check the 1,248 table-calendar windows below. Total windows advance
past constrained month ends before computing the
fraction; Jan 31 plus one month and ten hours uses the Feb 29–Mar 31 span.

Chinese, Dangi and Umm al-Qura now use owned ICU4X calendar packs. Chinese/Dangi
have no eras; their years match related Gregorian years. Leap months constrain
backward when absent from the target year. MonthDay follows the prescribed
1900–1972/1973–2035 reference windows and rare-leap-month rules. Umm al-Qura uses
civil arithmetic outside its official table. These packs add calendar data;
DateTimeFormat locale patterns remain separate.

Independent table controls use ICU4J and published HKO/KASI facts: 15,932 field
cases, 6,720 additions/differences and 1,248 total windows, plus all 2,474 HKO
month starts. The raw ICU diagnostic stays unfiltered and failing where its
approximate astronomy disagrees with those authorities. See
[authority provenance](../../conformance-tests/calendar-authorities/README.md).

Historical offset strings now retain syntactic precision: `+00:09` may match
Paris's `+00:09:21`, while `+00:09:00` must match exactly. Property bags always
match exactly. Zoned differences compare wall clocks before choosing calendar
months across DST gaps.

Day rounding caps elapsed time before the next earliest midnight. This handles
Casey's repeated 2010-03-04 without producing a second day's boundary. TS and
Rust check 5,292 independent ICU civil-boundary/rounding controls across ordinary
days, half-hour DST, midnight gaps/folds, skipped dates and repeated dates. Rust
also exposes `start_of_day`, `hours_in_day` and zoned `round` for day/time units.
A strict Intl timezone-edge suite adds 22 Test262 executions on Node and Hermes
source/optimized bytecode. No exclusions.

All eight prototypes expose `toLocaleString(locales?, options?)`. Locale methods
read private slots and capture formatter intrinsics; changing instance fields or
replacing the global formatter afterward does not change those intrinsics.
Date/time classes use DateTimeFormat; Duration uses DurationFormat.

For the owned Intl path, load the needed FormatJS Intl polyfills and locale,
calendar and timezone data before installing Temporal. Temporal's installer
registers its namespace with DateTimeFormat. Isolated namespaces can use
`DateTimeFormat.__addTemporalNamespace(Temporal)` explicitly. Locale datasets
remain outside the Temporal bundle.

The owned path has 306 strict locale/enumeration Test262 executions on Node and Hermes
source/optimized bytecode, plus 768 independent ICU locale style/offset controls
in English, German, French and Japanese. One pinned Test262 file assumes the
pre-CLDR49 bare-GMT zero form; current CLDR and ICU render numeric zero. The file
remains in unfiltered diagnostics; dedicated regressions cover its fixed offsets.

Legacy native Intl adaptation remains incomplete: direct DateTimeFormat calls
cannot yet inspect owned brands, YearMonth/MonthDay style filtering needs work,
and native Date clipping limits extended plain dates. These remain required work;
the package stays private. No native Temporal implementation is called.

Native Rust also has a caller-owned IANA registry and an optional Bazel-compiled
pack. Production lookup covers aliases, exact historical offsets and recurring
future rules. The native ICU suite now uses this registry directly; native
Hermes installation and complete WASM facade/data measurements remain pending.
See the [Rust registry API](../../crates/temporal/README.md#iana-registry).

Rust zoned strings now parse through the registry, including offset policies,
minute-precision historical matching and date-only start-of-day behavior. String
formatting supports precision/rounding and annotation options, with fresh offset
lookup after rounding. ICU/java.time and BigDecimal supply 29,550 independent
controls. See [native zoned strings](../../crates/temporal/README.md#zoned-strings).
Native Hermes installation and full WASM facade/data benchmarks remain pending.

Native `TemporalContext::compiled()` now combines the calendar/timezone registries.
Its string factories select all 16 calendars, including table calendars, without
manual JSON loading. The existing ICU calendar corpus exercises this production
path. See [native context](../../crates/temporal/README.md#calendar-registry-and-native-context).
Hermes native installation and complete WASM facade/data benchmarks remain pending.

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

Hermes/WASM delegate conversion, month/year metadata, eras, calendar addition and
differences to Rust for all 16 calendars. The FFI Bazel target embeds generated
calendar tables and validates its immutable registry once per process/module.
The default Rust core remains data-free and no_std. WASM ABI 3 requires the
matching packaged binary; ABI-2 modules reject before replacing active state.

JS retains object/coercion semantics and date/relative/zoned orchestration.
Timezone algorithms and data still use TS. Native operations propagate errors;
they never silently retry in TS. Extended calendar coordinates preserve short-date
reference windows; public date bounds remain checked by callers. Large safe
integer month/day values constrain before narrowing to native integers.

Independent public-class ICU controls now execute against Hermes source/HBC and
the published WASM namespace: 50,298 field/inverse samples, 39,072 additions,
39,072 differences, 176 bounds, 2,958 cross-class bridges and 6,656 relative Duration
windows. Both plain and UTC-zoned anchors check each relative window. These are
hybrid backend controls; complete native bindings, SDK installation and Intl
integration remain required.

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

Hermes/WASM now use the owned Rust IANA registry for identity, exact offsets,
possible instants, gap/fold resolution and strict next/previous transitions.
The FFI Bazel target embeds historical records and recurring future rules.
UTC and fixed offsets use the same backend path. WASM ABI 4 requires the matching
packaged binary; previous binaries reject before replacing active state.

Cached JS kernels select the current backend on every operation, including kernels
created before activation. Native errors propagate without falling back to TS.
The default TS path keeps lazy owned-data decoding. JS still owns coercion, slots
and date/relative/zoned orchestration; the complete Rust facade and SDK remain open.

Independent ICU controls pass on TS, Hermes source/HBC and the published WASM
namespace: 597 identities, 178,503 identity pairs, 17,640 offsets, 1,900 gap/fold
windows and 14,058 transition rows. Future samples extend through year 275000.
Transitions check both directions, strict boundaries and nanosecond neighbors;
resolution checks calendar versus elapsed days and relative Duration comparisons.
These controls do not establish complete native Temporal or native Intl support.

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

Hermes/WASM now delegate Duration parsing, validation, formatting, addition,
subtraction, negated/abs, comparisons, totals and rounding to Rust. Relative
operations use typed plain/zoned anchors with all 16 calendars and owned IANA
data. JS keeps coercion/order, brands/slots and field/sign/blank projections.
Selected native operations propagate errors without a TS retry. ABI 5 requires
the matching packaged WASM asset; older instances reject before activation.

Rust Duration::round supports unanchored day/time rounding with DateTimeUnit,
including multi-day increments. Large scalar Durations use Duration bounds;
relative calculations still check the actual calendar/instant endpoint.

Independent controls run through actual TS, Hermes source/HBC and published WASM
namespaces: 5,430 scalar cases, 51,840 plain rounds, 17,280 plain totals, 4,224 plain
comparisons, 19,440 zoned rounds and 6,480 zoned totals. Existing public calendar
controls retain all-16-calendar relative windows. Per-operation faults require
Rust for both scalar and relative calculations. Native date/zoned orchestration,
Now, SDK installation and Intl integration remain open.

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
