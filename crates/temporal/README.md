# formatjs_temporal

Allocation-free `no_std` Temporal core with eight value types, `Now`, all sixteen
calendars and IANA timezone providers. TypeScript package:
[@formatjs/temporal](../../packages/temporal/README.md).

```toml
[dependencies]
formatjs_temporal = { version = "1.0.0", features = ["compiled_data"] }
```

Default features need no bundled data. `compiled_data` includes all calendars and
IANA timezones; `compiled_calendars` and `compiled_time_zones` enable each separately.
Published crates contain generated data and a Cargo build script; Bazel is only
needed when building this repository.

Rust owns normalized Temporal operations. JS handles ECMAScript coercion, brands
and object allocation; Intl supplies locale rendering. Native Hermes calls the
Rust JSON FFI dispatcher and caches date-like result snapshots. The standalone
SDK installs Temporal and native Intl without a Rust toolchain.
Timezone candidate enumeration deduplicates offsets in a bounded stack buffer;
histories with more offsets still visit every distinct value.
`TimeZone::visit_offsets_at(local_nanoseconds, visitor)` defaults to full-history
visitation, preserving existing custom providers. TransitionZone narrows candidates
to the local timestamp plus/minus one day, including boundary state and recurring
rule offsets. NamedTimeZone and ResolvedTimeZone forward this optional optimization.
Validated offsets are strictly smaller than one day, so this window includes all
candidate instants and both sides of any containing gap/fold. No data or cache is
added. `visit_offsets` retains full-history behavior.
`TimeZone::has_out_of_range_candidate(local_nanoseconds)` lets providers check
whether a local time round-trips to an instant outside the supported range.
The default retains bounded enumeration. Borrowed and registered transition
providers use their exact rules near the limits.
See the [completion audit](../../knowledge-base/015a-temporal-completion-audit.md)
for current verification. Later sections retain historical implementation stages;
their pending-work statements describe those stages.

Core supplies Instant parsing, ISO conversion, all nine rounding modes, exact
Duration parsing/formatting/totals, clock arithmetic, calendar-aware plain
date/date-time, short-date and zoned types. Rational totals round once to binary64.

`with_fields` updates PlainTime, Duration, PlainDate, PlainDateTime, PlainYearMonth,
PlainMonthDay and ZonedDateTime without mutating the source.
Zoned `with_time_zone` keeps the Instant and calendar while accepting a new
provider type. `with_time(Some(time))` replaces the full clock with compatible
resolution: earlier in folds, forward through gaps. `with_time(None)` selects
the earliest instant of the civil day, which can differ from explicit midnight.

`PlainDate::to_zoned_date_time(zone, time)` consumes any `TimeZone` provider,
including providers without `Clone`, and retains the date's calendar. `None`
selects the earliest civil-day instant; `Some(time)` uses compatible gap/fold
resolution. A completely skipped date resolves to the following day's start.
This follows [PlainDate zoned conversion](https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.tozoneddatetime).

`TimeFields`, `DurationFields`, `DateTimeFields` and `ZonedFields` hold
optional fields. Clock units constrain separately; Duration retains unbalanced
units and validates signs. Date updates preserve month codes across leap years
and replace related era fields together. PlainDateTime also accepts calendar
fields through `from_calendar_fields`, defaulting omitted time fields to zero.
YearMonth ignores supplied days and normalizes its reference day. MonthDay does
not inherit its reference year. `ZonedWithOptions::default()` constrains fields
and prefers the source offset with compatible gap/fold resolution. Explicit
offset hints use exact nanoseconds, including historical second offsets.

`ZonedDateTime<Z, C>` keeps an Instant with timezone and calendar providers. `FixedOffset`
supplies constant zones; `TransitionZone` borrows sorted explicit records plus
optional recurring TZif rules. Queries skip events changing only abbreviation or
DST metadata. Gap resolution walks transitions. Calendar-span rounding uses
actual anchors; week rounding preserves larger calendar prefixes.

Relative Duration adapters: `total_duration`, `round_duration` and
`compare_durations` on `ZonedDateTime`. Required endpoint/next-day bounds remain
checked. Native Hermes bindings delegate normalized operations to this core. Native SDK installation and Intl integration are available.
Calendar-unit totals validate both interpolation endpoints even for exact results.
Zero zoned calendar totals use the positive window; plain zero totals return zero.

```sh
bazel test -c opt //crates/temporal:temporal_test
bazel run -c opt //benchmarks/temporal:native_ts_benchmark
```

Supported delivery paths are native Rust, TypeScript and native Hermes bindings.
Temporal WASM targets and npm assets have been removed. Native Rust benchmarks
exclude JavaScript binding costs; Hermes has separate end-to-end benchmarks.

Independent ICU4J controls cover 25,269 Gregorian conversions, 3,987 Instant
rounding cases, 7,130 signed Duration rounding/totals, 7,740 clock rounds,
840 date-arithmetic cases and 2,028 ISO short-date cases. Tests use the production
IANA registry for 17,640 offset/local samples, 1,900 future gap/fold controls and
14,058 strict transition query instants. Zoned difference and
relative Duration tests share 19,440 calendar-span rounds, including 6,480 exact
relative totals. Relative comparisons reuse the same future-transition controls.
Separate cases cover range edges, adjacent gaps and recurring leap-only rules.

`Now<SystemClock>` accepts host epoch nanoseconds, clamps Instant bounds and
converts through an explicit TimeZone provider. It supplies instant, zoned ISO,
plain date/time, date and time views. Injected clock tests reuse all 17,640
independent ICU timezone samples, including sub-millisecond nanoseconds. This
host boundary does not install a system clock or discover a system zone itself.
Pass the host's zone name to `TimeZoneRegistry::system`; like
SystemTimeZoneIdentifier it never fails and returns UTC when the host name is
missing or unresolvable.

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
uses only the shared numeric calendar kernel; timezone records can be caller-owned
or compiled through the optional registry below.

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
the rounded duration need not fit an actual date. Native Hermes bindings expose these operations through ABI 9.

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

## IANA registry

`TimeZoneRegistry` borrows sorted `TimeZoneRecord` values, without allocation or
runtime JSON/formatter dependencies. `resolve` accepts case-insensitive IANA
identifiers and minute-precision offset identifiers. `ResolvedTimeZone` retains
canonical spelling and primary identity, implements `TimeZone`, and compares
primary IDs. Equal offsets alone do not make named zones equal. UTC aliases and
fixed offsets work with an empty registry. Unknown names, missing valid records
and invalid data have distinct errors; missing data never substitutes UTC.

`//crates/temporal:with_time_zones` enables `compiled_time_zones` and
`TimeZoneRegistry::compiled()`. Bazel generates immutable Rust records from the
pinned TS timezone pack; generated records stay in Bazel outputs. Checked const
constructors validate transition bounds/order and future rules at compilation.
The default core includes no timezone pack. Bazel builds supply generated-file
environments; published crates include generated data for Cargo.

```rust
use formatjs_temporal::{Instant, TimeZoneRegistry, ZonedDateTime};
let registry = TimeZoneRegistry::compiled();
let zone = registry.resolve("US/Eastern").unwrap();
let value = ZonedDateTime::new("2400-07-01T00:00Z".parse::<Instant>().unwrap(), zone);
assert_eq!(zone.identifier(), "US/Eastern");
assert_eq!(value.local().unwrap().to_string(), "2400-06-30T20:00:00");
```

448 compiled primary records plus intrinsic UTC cover 597 IANA identifiers.
Existing native ICU controls now use this production registry, replacing the
former test-only JSON decoder. Alias coverage raises native checks to 17,640
future offset/local samples, 1,900 gap/fold controls and 14,058 transition query
instants (both directions plus nanosecond boundaries). ICU-only legacy names,
such as ACT, are checked as invalid identifiers; every recognized IANA name must
resolve successfully. Existing zoned/relative/day-rounding controls use the same
registry. Native Hermes uses the same production data; native benchmarks report
Rust timings separately from binding costs.

## Zoned strings

`ZonedDateTime::parse` takes a registry and `ZonedParseOptions`. Strings require a
zone annotation. `parse_in` additionally accepts a calendar provider, including
borrowed Chinese/Dangi/Umm al-Qura tables. The default arithmetic calendar parser
accepts the 13 arithmetic calendar IDs; explicit providers cover all 16. The
compiled-timezone variant also implements `FromStr` for its default calendar type.

`OffsetInput` distinguishes wall time, UTC `Z`, exact offsets and minute-precision
string offsets. `OffsetOption` supplies reject/prefer/use/ignore; disambiguation
supplies compatible/earlier/later/reject. Property-bag bridges use `Exact`, while
minute-only strings may match rounded historical second offsets. Explicit seconds
require exact matching. `Z` uses UTC regardless of the offset option. Date-only
strings select the first instant of the day, including skipped dates.

```rust
use formatjs_temporal::{ResolvedTimeZone, ZonedDateTime};
let value: ZonedDateTime<ResolvedTimeZone<'static>> =
    "1900-01-01T00:00+00:09[Europe/Paris]".parse().unwrap();
assert_eq!(value.to_string(), "1900-01-01T00:00:00+00:09[Europe/Paris]");
```

`Display` and `format(ZonedFormatOptions)` use resolved zone identity. Precision,
all nine rounding modes, offset visibility, zone-name visibility/critical flags
and calendar annotations are supported. Formatting rounds the instant first,
then recomputes the zone offset; crossing a transition prints the resulting local
clock/offset. ISO reference fields remain independent of the selected calendar.
Arbitrary unnamed `TimeZone` providers still support arithmetic and typed
`from_local_with_offset`; string output requires the identity supplied by a
resolved registry zone.

Independent ICU/java.time controls check 23,610 parsed/default strings across
historical and future dates. Another 5,940 ICU/BigDecimal controls check explicit
precision, all rounding modes, transitions, public instant limits and annotation
options. Native Test262-derived cases cover folds/gaps, offset policies, date-only
midnight gaps, syntax-dependent historical matching and asymmetric local bounds.
These typed numerical/string checks do not install a native Hermes backend.

The historical [size refresh](../../benchmarks/temporal/zoned-string-size-results.json)
measured data-free primitives: TS 3,757 gzip bytes, WASM 19,531 plus 463 bridge
bytes. The full TS namespace then measured 360,277 gzip bytes. These retired
measurements exclude the native zoned facade and compiled calendar/timezone data.

## Calendar registry and native context

`CalendarRegistry` resolves case-insensitive calendar IDs and normalized aliases.
Arithmetic engines are always available. `new` adds validated borrowed table
providers, rejecting duplicate IDs; unknown IDs and recognized-but-unloaded table
calendars have distinct errors. Lookup never substitutes ISO for missing data.
The registry copies provider views, so it does not borrow the temporary list used
to construct it. Data storage must outlive the returned values.

`//crates/temporal:with_calendars` enables `compiled_calendars` and
`CalendarRegistry::compiled()`. Bazel generates immutable Rust descriptors from
`@formatjs_generated/icu.calendar`. Registry creation validates the three table
packs through their existing checked constructors; retain the registry instead
of recreating it for each lookup. No runtime JSON/serde/formatter dependency or
allocation is added. Generated records remain in Bazel outputs.

`TemporalContext` combines calendar and timezone registries. Its `parse_date`,
`parse_date_time`, `parse_year_month`, `parse_month_day` and `parse_zoned` methods
select the calendar from string annotations and return values retaining their
providers. This includes Chinese, Dangi and Umm al-Qura without caller-side JSON
loading. The arithmetic-only default context still handles UTC/fixed-offset zones.

```rust
use formatjs_temporal::TemporalContext;
let context = TemporalContext::compiled().unwrap();
let date = context.parse_date("2023-03-22[u-ca=chinese]").unwrap();
assert!(date.calendar_fields().unwrap().month_code.leap);
```

`//crates/temporal:with_compiled_data` enables both data features and
`TemporalContext::compiled()`. This validates table packs once during context
creation. As with the timezone variant, generated-file environments are supplied
by Bazel. The default core remains data-free, `no_std` and allocation-free.

Existing ICU/HKO/KASI calendar tests now resolve providers through the production
registry, replacing the test-only JSON loader. All 50,298 field rows additionally
parse through `TemporalContext`; existing arithmetic/difference/relative/short-date
controls retain their full scope. Native context tests cover all date classes,
aliases, retained data lifetimes, leap-month policies and public date limits.
The context supplies data and typed values to native Hermes. See the completion
audit for current coverage.

## Historical backend measurements

WASM references below describe retired experiments. They are retained to explain
past measurements and ABI changes; WASM is no longer a supported delivery path.

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

## Native facade data ownership

The Hermes SDK and npm `wasm-native.js` entry now use Rust's calendar/timezone
records without duplicate TS tables. The default TS namespace and existing
index/wasm pair retain their own data. That earlier ownership change kept ABI9;
JS still supplies observable ECMAScript semantics and shared orchestration.
Published native-data WASM passes the same independent calendar/timezone/Duration
oracles as the retained-data profile. See the native-data benchmark snapshots:
consumer gzip falls from 806,221 to 469,793 bytes, versus TS 360,710. Both WASM
profiles lose all 43 V8 hot workloads to TS. Completion audit remains open.

## Typed WASM operations

ABI 16 provides typed variants for twenty-seven hot operations, signed 128-bit Instant
transfers, compact complete ISO date snapshots and streamed formatting. Rust ISO
formatting writes one bounded stack buffer. Non-ISO records and deferred getter
errors retain their general representation. SDK JSON responses keep their shapes.
Finite month/day fields constrain before narrowing to Rust integer widths;
non-finite values and `reject` still fail. Shared public controls cover TS, WASM
and Hermes in addition to independent ICU rows.

JS keeps observable coercions and required-field error types. Matching WASM
binary/adapter versions are required. See the [profile measurements](../../benchmarks/temporal/README.md#cpu-profile-follow-up-2026-11-17)
for latency, startup, size and remaining work.

ISO calendar resolution bypasses the compiled table registry. First non-ISO use
still initializes and validates table data. The fresh-process startup experiment
in `benchmarks/temporal/lazy-calendar-startup-results.json` reduces native-data
WASM ISO/timezone readiness from 25.0 ms to 16.3 ms (TS: 19.5 ms). Full calendar
readiness remains about 27 ms; table work is deferred, not removed.

PlainDateTime parsing, arithmetic and rounding return complete snapshots through
typed WASM routes. ISO DateTime records contain 48 bytes, including signed i128
nanoseconds, complete date properties and six clock fields. Other calendars retain
their deferred getter errors. Instant and PlainDateTime share the bounded ASCII
formatter; rounding still uses their public Rust methods.

ABI 14 clock records use 18 bytes for exact nanoseconds and six fields. Clock
storage stays i128; a measured u64 storage experiment had no stable overall gain
and was discarded. Validated clock transport/field calculations use native-width
integers. Shared rounding narrows only quotient/remainder operands when safe;
results remain i128 and larger operands keep their original path. Boundary tests
cover signed ties and results crossing i64 limits. Duration fields are rounded to
Number-representable integers and validated in Rust before binding construction.

ABI 15 returns Instant integers in 9 bytes when signed 64-bit values fit, otherwise
17 bytes for the full signed 128-bit value. Checked scalar rounding can return a
BigInt directly. Its reserved sentinel requests the full-width buffer path for
errors, wide results and the sentinel value itself. Engines without scalar i64
interop use buffers throughout. Both routes call the public Rust rounding method.
Native Instant factories wrap validated Rust results directly; numeric user
constructors retain range checks. JS option/coercion order stays unchanged.

ABI 16 adds typed timezone-transition requests/results. Rust checks recurring
transition candidates using one set of yearly events for before/after offsets.
January 1 retains separate rule-year windows; the first second after explicit
history retains its join check. No cache, new dependency or data-policy change.
Signed/full-range values, null transitions and malformed requests stay covered.

WASM ABI 18 adds direct zoned addition/subtraction, rounding and day-start
requests, for 32 typed routes among the same 69 normalized operations. Complete
ISO zoned records are written directly, including calendar/clock fields, exact
offset text/nanoseconds and day length. Non-ISO and deferred-error snapshots retain
the general path. Native SDK JSON shapes remain unchanged.
Private resolution works directly on validated local nanoseconds; public field
constructors still validate every field before timezone queries. Day boundaries
retain the same local range check. PlainDateTime constructors that only store
nanoseconds use that same range check without calculating unused ISO fields;
calendar validation still runs. Offset-hint resolution now uses bounded visitation.

WASM ABI 19 adds typed Duration parsing, addition/subtraction and negation/absolute
value: 35 typed routes among the same 69 operations. Each calls the existing
public Rust Duration API and returns all ten validated, Number-rounded fields.
The shared duration record also serves PlainTime differences. Numeric input
validation, unbalanced fields and positive zero remain intact. Malformed requests
retain strict framing and recovery. SDK JSON shapes stay unchanged.

WASM ABI 20 adds typed Instant, PlainDate, PlainDateTime and PlainYearMonth
differences: 39 typed routes, unchanged 69 operations. Requests preserve signed
128-bit nanoseconds or integral epoch days, both calendars for YearMonth and all
rounding options. Existing public Rust methods produce complete ten-field Duration
records. SDK JSON shapes and observable JS option/coercion order stay unchanged.

WASM ABI 21 adds typed zoned formatting: 40 typed routes, unchanged 69 operations.
It calls the public Rust formatter, preserving precision, rounding, annotation
policies and offset recalculation across transitions. Four plain date format
routes reuse existing interned calendar IDs, retaining strict UTF-8 fallback.
Native bindings retain the ISO epoch day already present in complete DateTime
records. Native SDK JSON stays compatible; keep WASM binary and JS adapter paired.

WASM ABI 22 adds typed YearMonth addition/subtraction and both short-date
projections: 43 typed routes, unchanged 69 operations. Each calls the public Rust
method and returns complete date metadata. ISO results use a shared stack record
also used by DateTime records and ISO field creation/updates. Other calendars and
deferred getter errors retain existing snapshots. SDK JSON remains compatible;
keep WASM binary and JS adapter paired.
