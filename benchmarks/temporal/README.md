# Temporal benchmarks

TS timezone/ISO primitives look worth pursuing. Full Temporal size, speed and
compliance remain unproven. Runtime and tests live in
[`packages/temporal`](../../packages/temporal/README.md); this directory owns
benchmarks and recorded measurements.

## Run

```sh
bazel test -c opt //packages/intl-datetimeformat:timezone_icu_test //packages/temporal:kernel_test
bazel run -c opt //benchmarks/temporal:benchmark
```

The benchmark prints JSON; `results.json` records one Linux x64 run on pinned
Node 24.14.0/V8 13.6. The reference imports `temporal-polyfill/implementation`
1.0.7, forcing JS even if native Temporal exists. Both run with host ICU 78.2,
tzdb 2025c; the kernel embeds pinned IANA 2026f. Selected benchmark zone rules
agree. Results do not compare identical data policies or API coverage.

## What runs

Package `kernel.ts` reuses `ecma262-abstract/DateOperations` and
`ecma402-abstract/DateTimeFormat/TimeZoneOffset`. It adds exact nanosecond/ISO
conversion, ISO day addition, possible instants and earlier/later/compatible/reject
disambiguation. `zones.ts` decodes only the requested canonical zone through the
shared timezone unpacker. No host Intl timezone lookup.

The Instant facade supplies the supported Instant operations; locale formatting remains incomplete; Duration now supplies the arithmetic foundation. `calendar.ts` separately supplies numeric
ISO/Hebrew arithmetic. Other optional TS calendars still use temporal-polyfill;
they cannot yet serve as an independent replacement.
Gap resolution walks indexed transitions. Offset bounds limit the search region;
multiple nearby gaps need no isolation assumption.
No full Temporal conformance claim.

## Independent checks

`//conformance-tests/icu4j:temporal_timezone_fixtures` uses ICU4J 79.1 (tzdb 2026e).
It samples January/April/July/October and every ICU transition at -1/0/+1 ms in
years 2101, 2400, 2500, 10000 and 275000. Formatter tests compare TS and Rust total
offsets across 457 shared zones and 13,160 samples. DST labels are excluded:
ICU and IANA can assign different standard/daylight labels to equal total offsets.
Future tzdb version differences can require investigation when these pins change.
ICU identifiers absent from the FormatJS pack are excluded explicitly by name.

Kernel tests derive gap/fold local times and expected results from those ICU
transitions. Additional fixed expectations cover New York, Lord Howe, Apia's
skipped day, Paris historical seconds, leap days, negative nanoseconds and
instant boundaries. Differential checks use the forced JS polyfill.

## Independent calendar arithmetic

`calendar.ts` converts ISO/Hebrew fields to/from epoch days, resolves ordinal
months and month codes (including Hebrew `M05L`), applies constrain/reject,
adds years/months/weeks/days, and computes day differences. It ports the existing
Rust Hebrew postponement formulas; runtime imports no Temporal or host Intl.
This is a numeric internal contract, not Temporal property-bag/coercion semantics.
Month/year differences, other calendars and calendar field merging remain open.

```sh
bazel test -c opt //packages/temporal:calendar_test
```

ICU fixtures cover over 6,000 dates in epoch days -1,000,000 through +1,000,000
plus denser 1900–2100 coverage. Both conversion directions match. An initial
full-range ICU4J 79.1 oracle stalled in `CalendarCache.findIndex` on extreme
negative dates; that unreliable range is excluded from the ICU control, not
claimed as validated by it. Separate forced-polyfill checks cover both full
Temporal date boundaries, leap-month/year arithmetic and signed durations.
The earlier size/runtime records below predate this separate calendar module.

## Instant facade and Test262 slice

`instant.ts` adds the Instant constructor, numeric factories, comparison, private branding,
read-only epoch getters, `valueOf`, and limited `from`/`equals`. Constructor input
coercion precedes observable `newTarget.prototype` access; a construct trap avoids
JS's normal allocation-before-body order. Static factories ignore subclass
receivers. WeakMap slots stay off instances and reject proxies/forged receivers.

String parsing accepts basic/extended dates and times, optional minutes/seconds,
nanosecond fractions, fractional numeric offsets, leap-second normalization and
RFC 9557 annotations. Unknown noncritical annotations are ignored; unknown
critical annotations and duplicate critical calendars are rejected. Annotations
do not change an Instant’s offset. ZonedDateTime input is supported; locale formatting remains unfinished.
Cross-realm slot sharing and foreign-realm default-prototype fallback remain open.
This slice is not installed globally outside the test prelude.

```sh
bazel test -c opt //packages/temporal:instant_test //packages/temporal:instant_test262
bazel run -c opt //benchmarks/temporal:facade_benchmark
# Diagnostic: expected to fail until the remaining Instant API exists.
bazel test -c opt //packages/temporal:instant_test262_full
```

The strict slice executes all constructor/prototype-root tests and complete
numeric-factory, epoch-getter, valueOf, toJSON and toStringTag directories, plus
parser-related `from` file groups from the pinned
Test262 checkout: **346/346 executions pass**. No individual-file exclusions or
expected-failure baseline. The prelude replaces the entire native Temporal
namespace in every realm, including recursively created realms.

The full Instant corpus remains a failing manual raw diagnostic. See
[`conformance-results.json`](../../packages/temporal/conformance-results.json) records counts and failure areas. Raw failures remain
in Bazel test output; the full diagnostic does not turn them into a green gate.

`facade-results.json` measures supported paths against forced `temporal-polyfill`
1.0.7 classes: seven alternating batches of 50,000 after 5,000 warmups. Output
values are compared before timing. Strings consume output length; numeric
results remain observable through bigint/number sinks. Inputs mix ordinary and
extreme-range cases, so these are not representative application averages.
One shared-host V8 run, ns/op:

| Operation                                          | Facade | Reference |
| -------------------------------------------------- | -----: | --------: |
| construct/get epochNanoseconds                     |    451 |       349 |
| fromEpochNanoseconds/get epochMilliseconds         |    460 |       346 |
| fromEpochMilliseconds/get epochNanoseconds         |    500 |       301 |
| ZonedDateTime parse/add day/toJSON                 | 12,862 |    11,312 |
| ZonedDateTime parse/round hour/toJSON              |  9,682 |    10,953 |
| ZonedDateTime until days/toJSON                    | 37,893 |    50,578 |
| ZonedDateTime next transition/get epochNanoseconds |    934 |       558 |
| from ISO string/get epochNanoseconds               |  1,813 |     2,030 |
| round microsecond/get epochNanoseconds             |    951 |     1,370 |
| toJSON                                             |  1,340 |     2,246 |
| toString named timezone                            |  2,006 |     5,803 |
| Duration parse/toJSON                              |  4,295 |    51,382 |
| Duration total microseconds                        |  3,989 |     2,823 |
| Instant until/toJSON                               |  4,723 |    25,619 |
| PlainYearMonth parse/add/toJSON                    |  6,504 |     3,862 |
| PlainMonthDay parse/toPlainDate/toJSON             |  3,587 |     3,744 |
| PlainDate parse/add/toJSON                         |  6,237 |     4,452 |
| PlainDateTime parse/add/toJSON                     |  7,880 |    10,747 |
| PlainTime parse/round/toJSON                       |  2,746 |     4,484 |
| PlainTime parse/add/toJSON                         |  4,467 |     6,041 |

Workload results vary. The zoned parse/add and parse/round workloads compare ordinary DST dates,
a fold with an explicit offset, a fixed-offset leap day and UTC. Output equality
is checked before timing. This shared-host run does not establish a complete
polyfill performance win; reference timezone data comes from host Intl.

Minified gzip: eight-class namespace **84,509 bytes**, including owned IANA data
and aliases. Independent Instant primitives are **2,688 bytes**; numeric calendar
code is **1,902 bytes**. These entries differ in API coverage and are not additive.
Reference is **19,393 bytes**, using host Intl timezone data. The WASM baseline
below covers earlier data-free Instant/Duration operations; complete facade/data
comparisons remain pending.

Full conformance reports retain every implementation failure. See the package
README and conformance-results.json for current counts across all eight classes.

## Measured footprint

Earlier numeric-kernel measurements in `results.json`, before public
serialization work. Minified gzip, esbuild ES2022, gzip level 9:

| Artifact                                                        |  Bytes |
| --------------------------------------------------------------- | -----: |
| Numeric kernel, data supplied by caller                         |  1,901 |
| Kernel plus all owned timezone data                             | 64,074 |
| temporal-polyfill basic implementation, host Intl timezone data | 19,393 |

These implement different APIs. Kernel size excludes the missing Temporal API
and non-ISO calendars. Code-only size is not measured incremental npm size:
sharing data/source across separately bundled published packages needs a packaging
plan and its own measurement. Data dominates the standalone owned-data variant.
WASM would still need that data plus JS object semantics/glue; this earlier
measurement did not include WASM. See the separate data-free baseline below.

`timezone-size-results.json` compares actual Bazel artifacts before/after the
future-rule change, with the same IANA pin and gzip settings. These are shipped
scripts without extra minification:

| Artifact          | Before gzip | After gzip |
| ----------------- | ----------: | ---------: |
| add-all-tz.js     |     196,256 |     62,690 |
| add-golden-tz.js  |     123,721 |     44,578 |
| polyfill.iife.js  |      45,840 |     46,427 |
| locale-data/en.js |      32,109 |     32,109 |

English locale output is byte-identical. Other locale generators are unchanged.
The baseline and changed commit IDs are recorded in the JSON. Build the four
corresponding `//packages/intl-datetimeformat` targets at each commit; locate
outputs with `bazel cquery -c opt --output=files` before compressing them.

## Measured runtime

Median ns/operation, seven batches of 20,000 after 5,000 warmup calls:

| Operation                              | Numeric kernel | Polyfill classes |
| -------------------------------------- | -------------: | ---------------: |
| Mixed instant offset lookup            |            215 |            5,886 |
| Ordinary/gap/fold local resolution     |          1,621 |            6,685 |
| Construct ISO fields/date, add one day |            801 |            2,816 |

Class construction and public field semantics are included only in the reference.
These show kernel headroom, not a faster full polyfill. Output equality is checked
before timing. Samples, engine/data versions and hardware are in `results.json`.

Five fresh subprocesses measure dynamic import, then first New York offset lookup;
process launch is excluded. Median import/first-use times are 5.69/0.57 ms for
kernel plus all zones, 6.69/13.65 ms for the reference. Uncontrolled heap deltas
are about 1.27 MB/0.95 MB; they are observations, not retained-memory measurements.
An initial eager-unpack version took about 21 ms to import and allocated about
5 MB. Lazy decoding removed that cost without dropping timezone coverage.
No browser/Hermes performance measurement yet.

## Next decision

Continue with the remaining Temporal class foundations and calendar-relative Duration operations, connect
ISO/Hebrew arithmetic to a PlainDate facade, and replace the gap-window
assumption with a transition index. Expand strict Test262 coverage as each complete surface lands.
Then compare equivalent standalone/shared-data packages on V8 and Hermes/browser
engines. Consider WASM after an equivalent core demonstrates a concrete benefit.

References: [ICU BasicTimeZone](https://unicode-org.github.io/icu-docs/apidoc/dev/icu4j/com/ibm/icu/util/BasicTimeZone.html),
[Temporal timezone semantics](https://tc39.es/proposal-temporal/docs/timezone.html).

## Rust core and Hermes checks

`crates/temporal` supplies an allocation-free, `no_std` Instant/ISO core and
parser. TS and Rust share exact valid/invalid parser cases. A separate ICU4J
79.1 proleptic Gregorian oracle supplies 25,269 samples across the full instant
range and adjacent local-date window; both implementations match both conversion
directions. This Gregorian control does not extend the bounded Hebrew oracle.

```sh
bazel test -c opt //crates/temporal:temporal_test //packages/temporal:instant_hermes_test262_strict //packages/temporal:instant_hermes_bytecode_test262_strict
```

Hermes tests install the owned TS payload without a reference Temporal fallback.
The current strict slice passes all 346 executions in both source and optimized bytecode modes, with no
exclusions or tracked failures. A zero-failure count guard pins the selection. Bytecode uses the compiler from the same pinned Hermes overlay. Rust native
Hermes bindings and complete Temporal coverage remain open. Initial WASM
primitive comparisons are recorded below.

## Independent rounding control

`temporal_rounding_fixtures` uses ICU4J 79.1 decimal division/rounding for 2,349
cases across nine modes, day-dividing increments, ties, negative epochs and
instant boundaries. ICU rounds after shifting the epoch by 100,000,000 days,
an even multiple of every tested quantum. Subtracting that origin preserves
Instant's positive-direction semantics and half-even parity. Both Rust and TS
match every case; this does not validate signed Duration rounding.

The full Instant diagnostic runs all 934 executions on Node and Hermes in
source/optimized-bytecode modes: 930 pass, 4 fail. Remaining locale/integration behavior stays visible. Strict gates cover the
346 passing constructor/parser/getter/toJSON executions. Native Rust Hermes
bindings and complete WASM facade comparisons remain open.

## Duration and Instant arithmetic

Duration provides validated branded fields, ISO parsing with exact fractional
hours/minutes/seconds, immutable operations and serialization. Time-only totals
and comparison are implemented; calendar-relative operations and Duration.round
remain incomplete. Instant add/subtract and differences use exact nanoseconds,
signed duration rounding and intrinsic Duration results.

ICU4J's independent decimal oracle checks 5,430 signed rounding and rational
number-total cases. Totals perform one IEEE binary64 rounding, avoiding loss
from first converting the nanosecond numerator to Number/f64. Rust fields follow
Float64-representable integer storage, including intentionally lossy balancing
into large millisecond/microsecond/nanosecond fields.

Node and Hermes source/optimized bytecode all pass strict selections of 346
Instant and 468 Duration executions. Full diagnostics remain failing: Instant
930/934, Duration 724/1086. Enable ES6 block scoping in both Hermes compilation
(`-Xes6-block-scoping`) and runtime. Native Rust bindings, remaining classes,
calendar-relative semantics and complete WASM facade comparisons are still pending.

## WASM baseline

```sh
bazel build -c opt //crates/temporal:wasm
bazel test -c opt //benchmarks/temporal:wasm_test //benchmarks/temporal:hermes_wasm_probe
bazel run -c opt //benchmarks/temporal:wasm_benchmark
```

[wasm-results.json](wasm-results.json) records one Linux x64 run on Node 24.14.0,
V8 13.6 and Intel Xeon Platinum 8488C. Rust 1.97.0 targets
`wasm32-unknown-unknown`; the cdylib uses `opt-level=z`, symbol stripping and
abort-on-panic, with the core dependency in normal optimized mode. No wasm-opt,
wasm-bindgen or new runtime dependencies. Timings execute Bazel bundles; JS
byte counts additionally use esbuild minification and gzip level 9.

| Artifact                           | Minified JS / raw WASM bytes | Gzip bytes |
| ---------------------------------- | ---------------------------: | ---------: |
| Owned TS operation bundle          |                       13,690 |      5,051 |
| WASM JS bridge                     |                          799 |        463 |
| Forced temporal-polyfill reference |                       56,696 |     19,393 |
| Rust WASM                          |                       43,911 |     19,669 |

WASM plus bridge costs 20,132 gzip bytes, 4.0 times the matched TS bundle.
Its initial linear memory is 1,114,112 bytes. Both owned bundles omit calendar
and timezone data. The TS bundle includes Duration object machinery; the WASM
bridge is a benchmark-only synchronous string ABI with 256-byte input/output
buffers, not Temporal brands, coercions or the complete public facade. The
reference supplies a broader API and host Intl integration. These sizes do not
predict a complete polyfill's size; the current 84,509-byte public TS namespace measurement
above includes owned IANA data, date/time classes and a different entry surface.

Median ns/call for ordinary inputs, including WASM UTF-8 input/output transfers:

| Operation                                    |    TS | WASM + bridge | temporal-polyfill |
| -------------------------------------------- | ----: | ------------: | ----------------: |
| Instant parse/epoch string                   |   982 |           364 |             1,708 |
| Instant parse/round microsecond/epoch string | 1,158 |           398 |             2,549 |
| Instant parse/format UTC                     | 1,728 |           690 |             3,485 |
| Duration parse/format                        | 3,588 |           819 |            50,809 |
| Duration parse/total microseconds            | 3,243 |           509 |             2,402 |

Each workload checks full results against forced `temporal-polyfill/implementation`
1.0.7 during 5,000 warmup calls, then measures nine rotating backend-order batches
of 30,000 calls. Boundary profiles remain separate in JSON; WASM is faster there
as well. This is one shared host, not a full-API or cross-engine performance claim.

Twelve fresh child processes alternate load order. Median module load / first
operation times in milliseconds: TS 1.758 / 0.502; WASM 1.136 / 0.565; reference 5.008 / 0.834. These exclude process startup and benchmark infrastructure imports;
filesystem caches may be warm. The WASM load includes reading bytes, importing
the bridge, compilation and instantiation.

The actual WASM binary passes all 5,430 independent ICU4J 79.1 signed rounding
and exact-total cases, plus invalid ABI/UTF-8/input checks, instant boundaries
and forced-polyfill controls. Existing native Rust and TS conformance gates
remain separate; this does not establish full Temporal compliance.

[wasm-host-results.json](wasm-host-results.json) records the pinned Hermes
capability probe. Both source and optimized bytecode report `WebAssembly` as
undefined. No WASM benchmark runs on Hermes. Keep TS support and implement native
Rust bindings; WASM cannot currently replace either path there. A complete WASM
facade, its object/coercion overhead and matching full data remain unmeasured.

## PlainTime

TS/Rust support independent ISO time/date-time parsing, field validation,
wraparound arithmetic, signed differences, field-relative rounding and precision
serialization. Date duration fields are ignored after duration validation. The
new ICU4J 79.1 decimal oracle verifies 7,740 clock-rounding cases across every
mode, ties, parent-field parity and midnight. Shared parser vectors cover basic
forms, annotations, ignored offsets, leap seconds and ambiguity rejection.

A complete construction/getter/add/subtract/toJSON/valueOf selection passes 234
executions on Node and Hermes source/optimized bytecode. Full PlainTime diagnostics
run 986 executions per mode: 982 pass, 4 fail. Locale formatting remains
failing, not excluded.
The public namespace grows 1,333 gzip bytes from the previous Instant/Duration
measurement. Native Rust Hermes bindings and the remaining classes remain open.

## PlainDate and PlainDateTime

The public package now exports real PlainDate and PlainDateTime classes, sharing
private slots with PlainTime for conversions that do not observe overridden
public getters. TS reuses owned ISO/Hebrew arithmetic and a Gregorian field view.
Other calendars remain unsupported; this is not full non-ISO conformance.

TS implements fields, parsing, updates, date/time conversions, arithmetic,
comparison, calendar-relative differences/rounding and serialization. Rust adds
ISO date/date-time parsing, validation, wrapping clock carry, year/month clamping,
clock differences, precision formatting and rounding. Rust calendar-relative
methods, calendar identifiers and remaining calendar engines still need work.

Both cores match 840 independent ICU4J 79.1 Gregorian arithmetic cases, covering
month ends, leap years, BCE, range edges and signed sub-millisecond carry. TS also
checks resulting weekday, ordinal and ISO week/year metadata against ICU. Existing
25,269-sample ISO controls and other calendar/timezone oracles remain separate.

Strict selections cover complete construction/prototype/getter/arithmetic families:
364 PlainDate and 518 PlainDateTime executions pass on Node and Hermes source and
optimized bytecode. Full diagnostics pass 1300/1308 and 1542/1552,
respectively. Intl integration and Duration-relative helper paths remain raw
failures. Real date-time conversions
improve full PlainTime coverage to 982/986. No implementation gap is an exclusion.

Five-class public namespace grows 5,071 gzip bytes from the previous measurement.
Native Rust Hermes installation, all calendar engines and complete WASM/public
object integration remain required by the full implementation goal.

## PlainYearMonth and PlainMonthDay

Both real classes share private calendar slots with date/time classes. Constructors
preserve reference ISO fields; string/property-bag conversions choose canonical
reference dates. Year-month bounds include reference days outside PlainDate's
range. Separate internal calendar conversion helpers handle those days while
public date bounds remain unchanged. Difference calculations allow unbounded
intermediate calendar anchors but still validate required date endpoints.

Rust provides ISO short-date parsing, reference-field storage, conversion,
year/month arithmetic and differences/rounding. TS also uses the existing Hebrew
calendar primitives; bounded Hebrew controls use forced full/implementation,
while the timing reference remains the forced basic implementation.

Both cores pass 2,028 independent ICU4J 79.1 cases covering Gregorian arithmetic,
month/year metadata, reference dates, leap-day constraining and nine-mode calendar
span rounding. Actual month lengths determine half ties, not fixed month counts.
Array-iterator poisoning tests check builtin calendar field preparation.

Complete construction/getter/arithmetic/conversion/serialization selections pass
348 YearMonth and 150 MonthDay executions per Node/Hermes source/bytecode mode.
Full diagnostics pass 1014/1022 and 394/398. Missing ZonedDateTime, Intl and relative
Duration integration remain failures, never allowed exclusions. Other calendar
engines, native Hermes installation and complete WASM facades stay required.

The earlier short-date layer added 2,122 gzip bytes. Current eight-class sizes
and all timing samples are recorded in facade-results.json.

## ZonedDateTime facade and Rust provider core

Owned TS timezone data now supplies zoned construction, fields, gap/fold and
offset matching, calendar versus elapsed arithmetic, updates, rounding, day
boundaries and conversions. Strict selection: 1,390 executions per Node/Hermes
source/bytecode mode. Full diagnostic: 1,796/1,804. Relative Duration helpers
and Intl integration remain failing, not exclusions.

Both language cores check ICU offset/local-field and future-transition controls.
Rust uses independently generated offset/transition providers; production IANA
loading, native Hermes bindings and complete WASM integration remain pending.
The WASM measurements above retain their earlier, narrower data-free scope.

## Zoned differences and transition queries

New workloads compare day-based zoned differences and next-transition lookup with
forced temporal-polyfill. Inputs reuse the ordinary DST, fold, fixed-offset and
UTC cases above. All outputs match before timing. Record every sample in
facade-results.json; results cover this shared-host V8 run, not complete APIs.

Both TS and the borrowed no_std Rust TransitionZone match 10,528 ICU strict
next/previous queries, including exact-event exclusion and adjacent nanoseconds.
They also match 19,440 independent ICU calendar-span/BigDecimal rounding cases
across all ten units, nine modes and signs. Calendar arithmetic tests include DST
and half-hour changes; separate controls cover skipped dates, adjacent gaps and
leap-only recurring changes across 2100. Real Rust providers now consume the
owned IANA records in tests, including all 13,160 offset/local cases and 1,340
gap/fold controls. Production registry/alias decoding and native Hermes binding
remain pending. The WASM profile still covers narrower Instant/Duration primitives.
