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
