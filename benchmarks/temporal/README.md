# Temporal benchmarks

## Plain Date callers after installation

Run `bazel run -c opt //benchmarks/temporal:legacy_date_benchmark`.
`legacy-date-results.json` compares native Intl with ordinary Date formatting
after importing the published `polyfill.js`. Existing formatters and formatters
constructed after installation are separate profiles. Gregorian UTC/New York,
French Paris and Hebrew New York use eight varying 2024 Dates and 24-hour clocks.
Strings and full parts must match captured native methods before timing.

Nine fresh processes per profile rotate execution order, with 1,024 warmup calls
and 8,192 measured calls per case. `format` includes bound getter access;
`formatToParts` includes the same joining/checksum overhead for every profile.
Installation and constructor time are excluded. No startup, heap, range or
Hermes claim. These measurements expose costs to callers that never pass Temporal
values; they do not establish acceptable overhead or optimize those paths.

Recorded V8 medians: existing formatters remain within 3% of native. New Gregorian
formatters take 5.1–6.3 times native `format` time and 2.6–2.7 times native
`formatToParts` time. Hebrew takes 15.2 and 6.2 times respectively. This is a real
installation cost for ordinary Date callers, measured on one host.

Runtime and tests live in
[`packages/temporal`](../../packages/temporal/README.md); this directory owns
benchmarks and recorded measurements. The package remains private pending release. Current
[completion evidence](../../knowledge-base/015a-temporal-completion-audit.md) records
conformance and delivery checks.

Latest namespace-consumer measurement: default TS 38,639 bytes gzip; standalone
339,338; forced `temporal-polyfill/full/implementation` 23,083. Default TS
and reference use installed Intl timezone data. Default retains compact verified
Chinese/Dangi data/arithmetic; standalone owns full calendar packs and IANA
histories. Minified bundled consumers exclude installation. Default drops 44.5%
from the previous owned-timezone 69,657-byte consumer.

Native-data WASM consumer plus binary totals 479,583 bytes gzip; hybrid
484,339. Binary contributes 443,098. Both retain Rust timezone data. See
`host-intl-default-startup-results.json` for current consumer sizes/startup.
Earlier hot-operation snapshots retain their original data policies.

## Remaining size audit

```sh
bazel run -c opt //benchmarks/temporal:size_audit
```

`size-audit-results.json` measures diagnostic AST feature removals from the same
published consumer. Baseline/reference must exactly reproduce the startup
snapshot (38,639/23,083 gzip bytes). Every requested rewrite is checked. Altered
builds deliberately lose behavior; these are not replacement implementations.

| Removal                                                          | Gzip bytes saved |
| ---------------------------------------------------------------- | ---------------: |
| Timezone names, links, primary identities and search intervals   |            6,317 |
| All locale formatting                                            |            5,838 |
| Calendar formatting corrections only, within locale formatting   |            3,678 |
| Chinese/Dangi/Umm al-Qura engines                                |            2,139 |
| Native backend dispatch                                          |              324 |
| Metadata, locale formatting, lunar engines and dispatch together |           14,574 |

Savings overlap; gzip effects are not additive. Combined altered consumer is
24,065 bytes, versus the reference's full 23,083. This locates the payload; it
does not prove every retained byte is necessary. Locale formatting is required
in both implementations, so its entire removal cost is not an extra feature
premium over the reference.

Calendar repairs cover host data differences, valid dates beyond Date TimeClip,
non-Gregorian numeric fields and locale output consistency. Verified lunar
arithmetic/data protects calendar boundaries and data joins. Existing independent
oracles and regression controls justify those behaviors. Native dispatch costs
only 324 bytes and permits shared TS/WASM/Hermes namespace integration; WASM
binary and backend encoder/decoder are not included in this default consumer.

Timezone metadata is the largest representation to revisit. Ours uses generated
exact spellings/aliases and primary identities plus close-transition sampling
intervals. The pinned reference uses Intl identities and a compact spelling
heuristic. Emptying our metadata breaks named zones and transition-search
assumptions. Exact metadata compaction is a valid follow-up; deleting validation
or weakening transition sampling is not an equivalent size reduction. No runtime
behavior changed during this audit.

## temporal_rs comparison

```sh
bazel run -c opt //benchmarks/temporal/rust:native_benchmark
bazel run -c opt //benchmarks/temporal:temporal_rs_benchmark
```

Pinned [temporal_rs 0.2.6](https://docs.rs/crate/temporal_rs/0.2.6), default features
disabled; ICU4X calendar 2.3.0 matches our generator. Benchmark-only Cargo workspace,
lockfile and Bazel repository keep production dependencies unchanged. Cargo
resolved dependencies using Bazel's pinned tools; Bazel compiles all artifacts.

`temporal-rs-native-results.json` records 25 native API workloads spanning all
eight types and five non-ISO calendars. Four inputs per case, checked outputs/
checksums, 256 warmup calls, nine alternating samples of 16,384 calls. Parsed
operands, calendar construction and registry validation happen outside timing.
Both engines allocate/hash strings for serialization. Calendar field workloads
use our aggregate API versus three public getters upstream. Tiny workloads
include checksum/harness overhead; no empty-loop subtraction or significance claim.

Upstream wins 22/25 recorded medians. Instant formatting is effectively tied;
our Instant parser is 3.05 times faster and microsecond rounding 2.21 times faster.
Chinese/Dangi fields are about 18 times faster upstream; month addition about
26 times faster. Hebrew month addition is about 3.1 times faster upstream. These
are local workload results, not a universal ranking. UTC/fixed-offset parsing
is covered; named timezone/DST providers and full independent conformance are not.

`temporal-rs-wasm-results.json` uses the same 256-byte UTF-8 input/output ABI and
JS bridge for both engines, with no WASM imports. All ordinary/boundary outputs
match forced temporal-polyfill's basic implementation; invalid-input controls
exercise both WASM modules. Nine rotating samples include encoding, parsing,
operation, formatting, decoding and checksum. Upstream uses allocation-free
Writeable for Instant, public String output for Duration; our module writes to
its buffer without an allocator. Both use identical Bazel opt settings and
wrapper opt-level=z, strip=symbols, panic=abort.

Primitive WASM raw/gzip sizes: ours 43,366/19,470 bytes; upstream 60,876/24,653.
Upstream is 8–19% slower across six Instant cases, 31–32% faster across two
Duration cases. Both initially reserve 1,114,112 linear-memory bytes. TS primitive
module is 3,783 gzip bytes; basic reference is 19,393, with broader exports/API.
These sizes exclude calendars, named timezone data and a JS Temporal facade.
They cannot be compared with the 443,098-byte full native-data backend binary.
No cold startup or complete replacement size is established.

These results support testing a temporal_rs adapter before expanding custom Rust
math. They do not demonstrate a full JS/Hermes replacement: coercion, brands,
Intl integration, provider wiring and complete conformance still need validation.

## Fresh-process startup

```sh
bazel run -c opt //benchmarks/temporal:startup_benchmark
```

Nine fresh Node 24 processes per profile, rotating profile order. Persistent V8
module compile caches are disabled and checked; filesystem caches remain warm.
Ready time includes import, WASM setup when applicable, then matched Instant,
New York timezone and Chinese calendar operations. It excludes Node bootstrap
and global installation. TS median is 20.84 ms; full reference 22.58; native-data
WASM 26.09; hybrid WASM 26.11. Prior owned-timezone TS measured 12.11 ms; this
smaller payload incurs more startup work in the recorded sample. Basic reference omits Chinese and is reported
separately. Heap/RSS deltas and WASM linear memory are not shipping sizes.

## Prior owned-timezone Hermes throughput

```sh
bazel run -c opt //benchmarks/temporal:hermes_instant_benchmark
```

`completion-hermes-results.json` records 43 ISO workloads against the forced basic
reference, source and optimized HBC. Compact default TS, normalized Rust bridge
and installed SDK all verify outputs and checksum 30956984. Source/HBC median
wins are 14/7, 25/16 and 25/14 respectively, each out of 43. Rust uses native
bindings; pinned Hermes has no WASM runtime. These local samples do not establish
universal performance rankings.

Earlier reports use the basic ISO/Gregorian reference entry. Current table-calendar
facade comparisons force `temporal-polyfill/full/implementation`; size reports
retain both entries. Primitive WASM comparisons retain the basic entry. The
19,393-byte historical reference size describes that basic build. See the
[upstream entrypoint documentation](https://github.com/fullcalendar/temporal-polyfill/blob/main/polyfill/README.md#package-entrypoints).

Current runtime exposes all 16 calendars. Facade profiles include 26 workloads.
Sections below retain historical implementation stages and measurements; their
open-work statements describe those stages.

## Locale methods

```sh
bazel run -c opt //benchmarks/temporal:locale_benchmark
```

`locale-results.json` measures all eight public locale methods. Owned methods
capture FormatJS DateTimeFormat and DurationFormat; DateTimeFormat includes
English data plus all calendar/timezone data. Other Intl prerequisites use host
implementations. Globals are restored before measurement, keeping the forced
`temporal-polyfill/full/implementation` reference on host Intl. Each workload
checks exact output equality before timing.

Namespace size is 360,277 gzip bytes. The combined locale bundle is 434,819;
the reference is 23,226 plus host Intl implementation/data. These bundles are
alternatives, not additive. Date/time locale methods take 330–1,545 µs versus
45–68 µs for the reference; Duration takes 29 versus 71 µs. Constructor/pattern
work remains a performance gap. This profile does not measure a complete WASM
facade; matched data-free TS/WASM primitives remain separate below.

## Run

```sh
bazel test -c opt //packages/intl-datetimeformat:timezone_icu_test //packages/temporal:kernel_test
bazel run -c opt //benchmarks/temporal:benchmark
```

The benchmark prints JSON; `results.json` records one Linux x64 run on pinned
Node 24.14.0/V8 13.6. The original reference imports the basic `temporal-polyfill/implementation`
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
13-calendar arithmetic. Public TS classes combine these engines with owned Chinese, Dangi
and Umm al-Qura tables for all 16 specification calendars.
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
This numeric internal contract is separate from public Temporal property-bag/coercion semantics. The later profiles below cover all 16 calendars, month/year differences and field merging.

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

| Operation                                             | Facade | Reference |
| ----------------------------------------------------- | -----: | --------: |
| construct/get epochNanoseconds                        |    471 |       303 |
| fromEpochNanoseconds/get epochMilliseconds            |    465 |       349 |
| fromEpochMilliseconds/get epochNanoseconds            |    565 |       334 |
| ZonedDateTime parse/add day/toJSON                    | 12,472 |    11,441 |
| ZonedDateTime parse/round hour/toJSON                 |  9,627 |    11,155 |
| ZonedDateTime until days/toJSON                       | 37,260 |    51,521 |
| ZonedDateTime next transition/get epochNanoseconds    |    887 |       549 |
| Duration parse/total months relative to date          | 10,062 |     8,658 |
| Duration parse/round months relative to date/toJSON   | 15,673 |    33,730 |
| Duration compare day versus 24 hours relative to zone | 15,046 |     3,708 |
| from ISO string/get epochNanoseconds                  |  1,816 |     2,098 |
| round microsecond/get epochNanoseconds                |  1,097 |     1,396 |
| toJSON                                                |  1,314 |     2,246 |
| toString named timezone                               |  1,950 |     5,726 |
| Duration parse/toJSON                                 |  4,135 |    52,154 |
| Duration total microseconds                           |  4,047 |     2,839 |
| Instant until/toJSON                                  |  4,729 |    25,472 |
| PlainYearMonth parse/add/toJSON                       |  6,477 |     3,940 |
| PlainMonthDay parse/toPlainDate/toJSON                |  3,590 |     3,815 |
| PlainDate parse/add/toJSON                            |  6,304 |     4,565 |
| PlainDateTime parse/add/toJSON                        |  8,086 |    11,123 |
| PlainTime parse/round/toJSON                          |  2,738 |     4,476 |
| PlainTime parse/add/toJSON                            |  4,471 |     6,004 |

Workload results vary. The zoned parse/add and parse/round workloads compare ordinary DST dates,
a fold with an explicit offset, a fixed-offset leap day and UTC. Output equality
is checked before timing. This shared-host run does not establish a complete
polyfill performance win; reference timezone data comes from host Intl.

Minified gzip: eight-class namespace plus Now **85,948 bytes**, including owned IANA data
and aliases. Independent Instant primitives are **2,689 bytes**; numeric calendar
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

Finish locale/Date integration, remaining calendars and native Rust adapters.
Expand strict Test262 coverage as each complete surface lands.
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
hours/minutes/seconds, immutable operations and serialization. Totals, comparison and rounding support plain-date and zoned relative contexts
in TS. Rust supplies ISO plain/zoned relative adapters. Instant add/subtract and differences use exact nanoseconds,
signed duration rounding and intrinsic Duration results.

ICU4J's independent decimal oracle checks 5,430 signed rounding and rational
number-total cases. Totals perform one IEEE binary64 rounding, avoiding loss
from first converting the nanosecond numerator to Number/f64. Rust fields follow
Float64-representable integer storage, including intentionally lossy balancing
into large millisecond/microsecond/nanosecond fields.

Node and Hermes source/optimized bytecode all pass strict selections of 346
Instant and 1,072 Duration executions. Full diagnostics remain failing: Instant
930/934, Duration 1082/1086. Enable ES6 block scoping in both Hermes compilation
(`-Xes6-block-scoping`) and runtime. Native Rust bindings, remaining calendars, locale integration and complete
WASM facade comparisons are still pending.

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
| Owned TS operation bundle          |                        9,527 |      3,757 |
| WASM JS bridge                     |                          799 |        463 |
| Forced temporal-polyfill reference |                       56,696 |     19,393 |
| Rust WASM                          |                       43,911 |     19,669 |

WASM plus bridge costs 20,132 gzip bytes, 5.4 times the matched TS bundle.
Its initial linear memory is 1,114,112 bytes. Both owned bundles omit calendar
and timezone data. The TS bundle uses pure parse/format/total operations; the WASM
bridge is a benchmark-only synchronous string ABI with 256-byte input/output
buffers, not Temporal brands, coercions or the complete public facade. The
reference supplies a broader API and host Intl integration. These sizes do not
predict a complete polyfill's size; the current 85,948-byte public TS namespace measurement
above includes owned IANA data, date/time classes and a different entry surface.

Median ns/call for ordinary inputs, including WASM UTF-8 input/output transfers:

| Operation                                    |    TS | WASM + bridge | temporal-polyfill |
| -------------------------------------------- | ----: | ------------: | ----------------: |
| Instant parse/epoch string                   |   992 |           368 |             1,698 |
| Instant parse/round microsecond/epoch string | 1,141 |           403 |             2,500 |
| Instant parse/format UTC                     | 1,738 |           686 |             3,415 |
| Duration parse/format                        | 2,417 |           812 |            51,612 |
| Duration parse/total microseconds            | 1,940 |           511 |             2,384 |

Each workload checks full results against forced `temporal-polyfill/implementation`
1.0.7 during 5,000 warmup calls, then measures nine rotating backend-order batches
of 30,000 calls. Boundary profiles remain separate in JSON; WASM is faster there
as well. This is one shared host, not a full-API or cross-engine performance claim.

Twelve fresh child processes alternate load order. Median module load / first
operation times in milliseconds: TS 1.538 / 0.512; WASM 1.129 / 0.570; reference 5.000 / 0.830. These exclude process startup and benchmark infrastructure imports;
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
optimized bytecode. Full diagnostics pass 1304/1308 and 1548/1552,
respectively. Locale integration remains a raw failure. Real date-time conversions
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
Full diagnostics pass 1018/1022 and 394/398. Remaining locale failures stay
visible, never allowed exclusions. Other calendar
engines, native Hermes installation and complete WASM facades stay required.

The earlier short-date layer added 2,122 gzip bytes. Current eight-class sizes
and all timing samples are recorded in facade-results.json.

## ZonedDateTime facade and Rust provider core

Owned TS timezone data now supplies zoned construction, fields, gap/fold and
offset matching, calendar versus elapsed arithmetic, updates, rounding, day
boundaries and conversions. Strict selection: 1,790 executions per Node/Hermes
source/bytecode mode. Full diagnostic: 1,800/1,804. Locale integration remains failing, not excluded.

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
gap/fold controls. Production transition registry decoding and native Hermes binding
remain pending. The WASM profile still covers narrower Instant/Duration primitives.

## Relative Duration layer

The namespace adds 1,196 gzip bytes. New workloads cover totals and half-even
month rounding relative to a date, plus calendar-day versus 24-hour comparison
relative to a zone. All outputs match the forced reference before timing. This
sample has faster relative rounding, slower totals and slower zoned comparison.

Public Duration and Rust zoned adapters match 19,440 ICU relative rounds,
6,480 exact totals and 1,340 transition comparisons. TS also has bounded Hebrew
reference controls. Native bindings and
complete calendar coverage remain pending.

The primitive WASM TS entry now calls pure parse/format/total helpers, matching
the numeric ABI without Duration object/facade machinery. This changed the TS
measurement scope; it is not a public-package size reduction. Both primitive
backends omit calendar/timezone data. The full namespace profile remains separate.

## Now namespace size

Now adds 243 gzip bytes to the preceding relative-Duration layer. The
namespace now measures 85,948 bytes gzip, including owned IANA data. Timed
workloads still cover the eight classes; this run does not measure Now throughput.
These shared-host V8 samples were rerun after conformance tests completed.
The earlier matched pure TS/WASM primitive profile retains its separate scope.

## Installation and published modules

```sh
bazel run -c opt //benchmarks/temporal:size_benchmark
```

[package-size-results.json](package-size-results.json) measures the current table-calendar layer separately from earlier throughput samples. The first
profile bundles each entry standalone. All full entries include owned IANA data;
detection does not. Full reference uses host Intl and supplies broader locale integration. These alternatives are not additive and do not establish full equivalence.

| Standalone bundle        | Minified bytes | Gzip bytes |
| ------------------------ | -------------: | ---------: |
| instant-code.js          |      3,194,545 |    358,888 |
| polyfill-code.js         |      3,195,202 |    359,038 |
| polyfill-force-code.js   |      3,195,204 |    359,040 |
| should-polyfill-code.js  |            696 |        361 |
| reference-bundle.js      |         56,696 |     19,393 |
| reference-full-bundle.js |         66,195 |     23,226 |

Published installation modules import the shared index, preserving constructors,
private slots and the named Date bridge across entrypoints. These per-file gzip
sizes describe an unbundled npm installation; add the index once for an installer.
A consumer bundler may compress/deduplicate the combined graph differently.

| Published module   | Minified bytes | Gzip bytes |
| ------------------ | -------------: | ---------: |
| index.js           |      3,194,430 |    358,762 |
| polyfill.js        |          1,058 |        485 |
| polyfill-force.js  |          1,060 |        486 |
| should-polyfill.js |            587 |        302 |

Primary timezone identity added 269 gzip bytes to the standalone namespace;
plain endpoint validation adds another 17 bytes. Shared calendar math adds 529 bytes.
DateTimeFormat locale files do not gain this data.

The current report also refreshes matched data-free primitive sizes: TS
3,757 gzip bytes; Rust WASM 19,557 plus 463 JS bridge, 20,020 total.
WASM plus bridge is 5.33 times the matched TS bundle. The earlier timed WASM run
above remains historical; current matched primitive measurements are recorded below.
These primitives exclude the full facade and calendar/timezone data. Complete
WASM equivalence and native Hermes artifact measurements remain pending.

## Plain-relative Rust and endpoint range checks

[plain-relative-results.json](plain-relative-results.json) records the prior
Node 24.14.0 Linux x64 run after adding plain endpoint clock-carry validation.
It retains all 23 matched facade workloads, with 5,000 equality/warmup calls,
seven alternating batches of 50,000 calls and median ns/call. Earlier facade
results remain historical. Inputs include ordinary calendar anchors, DST/folds
and fixed offsets; this does not establish full calendar/locale equivalence.

Relative month Duration parse/total: TS 10,128 ns, temporal-polyfill 8,620 ns.
Parse/round/toJSON: TS 15,769 ns, reference 33,878 ns. Both include API coercion
and parsing; these are JS facade measurements, not native Rust timings.

Rust now shares ISO plain/zoned calendar rounding and supplies plain-relative
Duration adapters. Independent ICU controls run on native Rust, Node and Hermes
source/bytecode. This does not add a native Hermes binding or a full WASM facade.
Current sizes remain in package-size-results.json. The nested `matchedPrimitives`
record refreshes the data-free TS/WASM comparison after extracting raw internal
ISO coordinates; the earlier WASM report remains historical.

Prior ordinary-input median ns/call, including WASM UTF-8 transfers:

| Primitive                                    |    TS | WASM + bridge | temporal-polyfill |
| -------------------------------------------- | ----: | ------------: | ----------------: |
| Instant parse/epoch string                   |   980 |           386 |             1,702 |
| Instant parse/round microsecond/epoch string | 1,145 |           409 |             2,541 |
| Instant parse/format UTC                     | 1,712 |           698 |             3,422 |
| Duration parse/format                        | 2,401 |           828 |            51,861 |
| Duration parse/total microseconds            | 1,947 |           505 |             2,331 |

This profile checks 5,000 warmup inputs and runs nine rotating batches of 30,000
calls. It excludes the public object facade and calendar/timezone data; the
reference uses its class API to produce equivalent outputs. Twelve fresh-child
loads give TS load/first-operation medians of 1.535/0.506 ms, WASM 1.145/0.576 ms.
These exclude benchmark infrastructure/process startup; filesystem caches may be
warm. Raw WASM is 43,900 bytes; minified/gzip TS and bridge sizes remain unchanged.
Pinned Hermes still has no WebAssembly, so these timings cover Node only.

## Shared arithmetic calendar kernel

[calendar-kernel-results.json](calendar-kernel-results.json) refreshes all 23
matched facade workloads and the nested TS/WASM/reference primitive profile.
Runs execute sequentially without competing Bazel tests. Earlier plain-relative
results remain historical. This earlier numeric-kernel layer covers 13 engines; its public
TS classes supported ISO/Gregorian/Hebrew, native date classes ISO.

Relative month totals: TS 11,580 ns/call, reference 8,700. Relative month rounding:
TS 17,814 ns/call, reference 33,686. These include parsing and API coercion.
Full exported TS numeric calendar module is 3,126 gzip bytes; namespace adds
529 bytes after tree shaking. No DateTimeFormat locale data added.

Matched data-free primitives remain 3,757 gzip bytes in TS. Rust WASM is 19,561;
JS bridge adds 463, total 20,024. These measurements exclude the complete WASM
facade/calendar/timezone data. Pinned Hermes still lacks WebAssembly; TS source/
bytecode passes, native Rust Temporal bindings remain pending.

Recorded ordinary-input median ns/call, including WASM UTF-8 transfers:

| Primitive                                    |    TS | WASM + bridge | temporal-polyfill |
| -------------------------------------------- | ----: | ------------: | ----------------: |
| Instant parse/epoch string                   |   990 |           361 |             1,763 |
| Instant parse/round microsecond/epoch string | 1,147 |           392 |             2,391 |
| Instant parse/format UTC                     | 1,686 |           649 |             3,399 |
| Duration parse/format                        | 2,329 |           815 |            51,455 |
| Duration parse/total microseconds            | 1,937 |           509 |             2,335 |

## Public arithmetic calendars

[public-calendar-results.json](public-calendar-results.json) records sequential
23-workload facade and matched TS/WASM/reference primitive measurements after
public integration of 13 arithmetic calendars. Existing reference equality checks
run before timing. This workload set does not benchmark every calendar.
Native public date classes remain ISO; complete WASM facade/data and native Hermes
bindings remain pending. Earlier reports above remain historical.

Standalone namespace: 87,709 gzip bytes, including owned
IANA data; forced temporal-polyfill: 19,393, using host Intl.
Matched data-free TS primitives: 3,757; WASM: 19,557 plus 463 JS bridge,
20,020 total (5.33 times TS). Complete implementations remain unequal.
No DateTimeFormat locale data added.

Recorded ordinary-input median ns/call, including WASM UTF-8 transfers:

| Primitive                                    |    TS | WASM + bridge | temporal-polyfill |
| -------------------------------------------- | ----: | ------------: | ----------------: |
| Instant parse/epoch string                   |   984 |           365 |             1,777 |
| Instant parse/round microsecond/epoch string | 1,168 |           394 |             2,557 |
| Instant parse/format UTC                     | 1,726 |           656 |             3,542 |
| Duration parse/format                        | 2,455 |           852 |            51,689 |
| Duration parse/total microseconds            | 1,932 |           526 |             2,405 |

Facade relative-month measurements, including parsing and coercion:

- Duration parse/total months relative to date: TS 10,820 ns; reference 8,761 ns.
- Duration parse/round months relative to date/toJSON: TS 12,894 ns; reference 34,131 ns.
- Duration compare day versus 24 hours relative to zone: TS 15,941 ns; reference 3,696 ns.

## Table calendars

[table-calendar-results.json](table-calendar-results.json) records 26 matched
facade workloads, adding Chinese/Dangi/Umm al-Qura property-bag construction,
month addition and serialization. All outputs match forced temporal-polyfill
1.0.7 full/implementation before timing. Tests and benchmarks run sequentially. Prior reports remain
historical; these workloads do not establish full API equivalence.

Standalone namespace: 358,888 gzip bytes, including owned IANA and full-range
calendar packs. Full reference: 23,226, using host Intl. Basic ISO/Gregorian reference
remains separately measured. This table-data increase
is separate from DateTimeFormat locale patterns. Calendar packs include indexed
internal rounding coordinates through ±110000000 epoch days.

| Table calendar workload                           | TS ns/call | Reference ns/call |
| ------------------------------------------------- | ---------: | ----------------: |
| PlainDate chinese from/add months/toJSON          |     21,400 |            50,645 |
| PlainDate dangi from/add months/toJSON            |     21,219 |            49,738 |
| PlainDate islamic-umalqura from/add months/toJSON |      9,277 |             8,817 |

Matched data-free primitives: TS 3,757 gzip bytes; Rust WASM 19,557 plus
463 JS bridge, 20,020 total (5.33 times TS). This profile
excludes the full facade and calendar/timezone data. Complete WASM and native
Hermes backend measurements remain pending; Hermes has no WebAssembly.

| Primitive                                    | TS ns/call | WASM + bridge ns/call | Reference ns/call |
| -------------------------------------------- | ---------: | --------------------: | ----------------: |
| Instant parse/epoch string                   |      1,017 |                   361 |             1,756 |
| Instant parse/round microsecond/epoch string |      1,155 |                   392 |             2,406 |
| Instant parse/format UTC                     |      1,776 |                   659 |             3,422 |
| Duration parse/format                        |      2,261 |                   822 |            51,534 |
| Duration parse/total microseconds            |      1,945 |                   508 |             2,383 |

## Historical zoned edges

[zoned-edge-results.json](zoned-edge-results.json) refreshes the same 26 facade
workloads after exact-offset parsing, DST month differences and repeated-date
rounding fixes. Every warmup output agrees with forced `temporal-polyfill`
1.0.7 full/implementation. This run follows 87 passing regression targets.

Standalone namespace is 358,928 gzip bytes (+40); full reference is 23,226,
using host Intl. Zoned day differences measure TS/reference 12,962/51,032 ns;
relative-month totals 10,896/8,740 ns; relative-month rounds 13,030/33,721 ns.
Single-host timings describe these workloads, not complete API equivalence.

Matched data-free primitives remain 3,757 TS gzip bytes versus 19,557 WASM plus
463 JS bridge, 20,020 total. Fresh nested samples retain the basic ISO/Gregorian
reference and the same validation/batch method. Full WASM facade/data and native
Hermes backend measurements remain pending.

## Native calendar size refresh

`native-calendar-size-results.json` records fresh namespace/package sizes after
calendar-aware Rust date/date-time/zoned integration. The TS namespace remains
360,277 gzip bytes. Matched data-free primitives are 3,757 TS bytes versus 19,552
WASM plus 463 bridge bytes (20,015 combined). Minification/compression uses the
same Bazel/Node path as earlier size reports; prior throughput is separate.
The new public Rust facades and calendar data are not exposed by that primitive
WASM ABI. Full WASM facade/data and native Hermes Temporal bindings remain open.

`zoned-string-size-results.json` refreshes the same primitive profile after native
zoned parsing/formatting and shared offset formatting. Namespace TS stays 360,277
gzip bytes; matched primitives stay 3,757 TS bytes, while WASM is 19,531 plus 463
bridge bytes (19,994 combined). Native zoned/calendar facades and their data are
not exported by this primitive ABI. Full backend size/performance remains open.

`native-iso-size-results.json` refreshes size after the experimental Hermes Rust
ISO bridge. Default namespace TS is 360,287 gzip bytes, up 10 bytes. Matched
data-free primitives are 3,773 TS bytes versus 19,494 WASM plus 463 bridge bytes
(19,957 combined). The native ISO JSON bridge is a partial backend and remains
opt-in; these numbers do not measure its native archive or a full WASM facade.
Reference `temporal-polyfill` 1.0.7 remains 19,393 bytes basic / 23,226 full,
using host Intl. Equivalent full-backend throughput and size remain open.

`hermes-instant-results.json` records the public Instant facade in Hermes source
and optimized bytecode, with pure TS and the opt-in Rust ISO/Instant JSON bridge.
Run `bazel run -c opt //benchmarks/temporal:hermes_instant_benchmark`.
Each process checks eight inputs against `temporal-polyfill` 1.0.7 basic, warms
1,000 calls, then measures five samples of 5,000 calls. Startup and data size are
excluded. The Rust namespace remains hybrid outside ISO/Instant.

Bytecode medians, TS / Rust / reference (Rust-process sample), microseconds/op:

- Parse: 9.00 / 3.17 / 17.12.
- Format: 8.88 / 6.70 / 9.35.
- Add: 6.82 / 15.09 / 17.90.
- Round: 2.91 / 5.63 / 15.51.
- Until: 15.04 / 15.59 / 17.00.

Rust improves parsing/formatting here; JSON transport hurts cheaper operations.
Reference measurements from each process and every sample remain in the JSON.
One host does not establish universal speed. Full WASM/native facades, equivalent
data and shipped backend comparisons remain required.

`native-instant-size-results.json` refreshes the unchanged size scopes: default
namespace TS 360,301 gzip bytes (+14); data-free primitive TS 3,783 versus WASM
19,494 + 463 bridge bytes (19,957 combined). The full native Instant JSON ABI is
not exposed by the existing primitive WASM export. These remain partial WASM
measurements, separate from the Hermes public-operation timings above.

`wasm-facade-results.json` measures actual published namespace entries, comparing
TS, the opt-in ISO/Instant WASM JSON backend and `temporal-polyfill` 1.0.7 basic.
Run `bazel run -c opt //benchmarks/temporal:wasm_facade_benchmark`.
Eight inputs pass parity checks; 3,000 warmup calls precede seven samples of 10,000
calls. Profiles run TS, WASM, reference in one process; timing excludes startup.

Recorded Node24/V8 medians, TS / WASM / reference, microseconds/op:

- Parse: 1.71 / 3.10 / 2.69.
- Format: 0.69 / 7.04 / 1.37.
- Add: 2.33 / 10.08 / 1.49.
- Round: 0.57 / 4.01 / 0.68.
- Until: 2.35 / 9.41 / 24.32.

WASM's JSON transport loses to TS here. This partial backend still retains TS
algorithms and all owned calendar/IANA data. It does not benchmark full native
Temporal, native calendar/timezone data or production workload distributions.
Raw samples, cold compile/instantiate time and WASM linear memory are recorded.
Memory figures exclude the JS heap. One host does not establish universal speed.

Consumer bundles (all index exports, optional WASM setup; esbuild es2022 minify,
gzip9) are 360,183 bytes TS versus 361,477 JS +58,527 binary =420,004 WASM profile.
The binary is 132,990 raw bytes. Required ESM modules compressed separately total
361,144 TS versus 420,475 WASM bytes. These are alternative delivery modes.
Declarations, source maps and notices ship in the package but are not runtime
imports. Rust dependency notices accompany the binary as `WASM_NOTICES.html`.

`wasm-backend-size-results.json` refreshes the existing Rolldown/primitive report
and adds `publishedGraphs`: index.js requires private native.js, and the WASM
profile additionally requires wasm.js plus the binary. Counting only index.js
would now undercount direct ESM delivery. The old 19,494-byte primitive binary
remains a separate export with a much smaller API; it is not this backend.

`hermes-plain-time-results.json` and `wasm-plain-time-results.json` extend the same
public-operation benchmarks with five PlainTime workloads. `timeParse` and
`timeAdd` read the nanosecond projection; `timeRoundFormat` includes serialization.
All eight inputs pass reference parity. Earlier snapshots retain their scopes.

Hermes bytecode medians, TS / Rust / reference (Rust-process sample), microseconds:

- Time parse + projection: 10.28 /9.10 /10.62.
- Time format: 8.33 /3.14 /3.11.
- Time add + projection: 12.97 /21.40 /12.21.
- Time round + format: 11.71 /8.01 /9.59.
- Time until: 16.29 /16.39 /14.16.

V8 medians, TS / WASM / reference, microseconds:

- Time parse + projection: 1.18 /3.30 /2.71.
- Time format: 0.74 /3.44 /0.76.
- Time add + projection: 2.45 /10.30 /1.56.
- Time round + format: 1.29 /7.88 /1.84.
- Time until: 2.59 /9.49 /24.44.

Rust helps Hermes formatting/rounding here; JSON and projection costs limit other
operations. WASM loses to TS on these five V8 workloads. One host and these inputs
do not establish universal speed or justify a default backend switch.

`plain-time-backend-size-results.json` refreshes the existing delivery scopes.
The current binary is 147,964 raw /62,954 gzip bytes. Consumer bundles are 360,302
TS versus 361,781 JS +62,954 binary =424,735 WASM bytes. Required separate ESM
files total 361,425 TS versus 425,183 WASM bytes. Native calendar/timezone
algorithms/data still use TS; full-backend size proof remains open.

## Native calendar bridge

`hermes-calendar-results.json` and `wasm-calendar-results.json` add five ISO date
workloads to the existing Instant/PlainTime commands. All eight inputs pass
`temporal-polyfill` 1.0.7 basic-reference parity. YearMonth inputs vary their month;
`dateFields` reads eight fields/metadata values. All 16 native calendars ship,
but these throughput cases measure ISO behavior. Independent ICU controls supply
non-ISO coverage. Final Hermes and V8 runs ran sequentially without concurrent
build/test/benchmark work. Earlier snapshots retain their original scopes.

Hermes bytecode medians, TS / Rust / reference (Rust process), microseconds:

- Date from bag + day: 9.03 /11.60 /5.24.
- Date fields/metadata: 22.38 /37.53 /1.99.
- Date add + format: 41.71 /34.57 /11.91.
- Date until + format: 57.88 /34.70 /14.07.
- YearMonth add + format: 42.51 /36.18 /11.83.

V8 medians, TS / WASM / reference, microseconds:

- Date from bag + day: 1.37 /10.03 /0.87.
- Date fields/metadata: 2.70 /45.86 /0.44.
- Date add + format: 5.67 /30.16 /2.04.
- Date until + format: 6.14 /9.17 /24.05.
- YearMonth add + format: 5.55 /37.26 /1.94.

Rust improves three Hermes workloads here; repeated JSON crossings hurt getters.
WASM loses all five cases against TS. One host and partial native coverage do not
establish a default backend. Recorded WASM compile/instantiate costs are 1.25/1.51
milliseconds; first native call 3.37 ms, first calendar operation 9.69 ms including
registry validation. JS/TS was already warm; these are not cold JS-load timings.

`calendar-backend-size-results.json` measures the shipped native pack plus retained
TS fallback algorithms/data. The WASM binary is 2,905,657 raw /315,320 gzip bytes.
Consumer bundles: TS 360,454 gzip; WASM JS 362,248 +binary 315,320 =677,568.
Separately compressed ESM: TS 361,876 versus WASM 678,000. Native calendar tables
now duplicate retained JS tables. Native timezone data and remaining native
orchestration are still absent; full-backend cost remains unproven.

## Native timezone bridge

`hermes-timezone-results.json`, `wasm-timezone-results.json` and
`timezone-backend-size-results.json` include all16 native calendars and the owned
IANA registry. Five zoned workloads cover gap/fold parsing, exact offsets, calendar
day addition/differences and next transitions. Eight inputs include New York,
Paris, Lord Howe, Apia, Kathmandu, St Johns and UTC. Parity is checked before timing.
Transitions use 128 warmup +512 calls per sample; other counts remain unchanged.

Hermes enables native DateTimeFormat for both profiles and registers the generated
native English locale/number pack plus owned timezone data. This supplies Intl to
the reference; registration is outside timings. V8 uses its recorded host ICU.
Final runs execute sequentially after validation. Older snapshots keep their scopes.

Hermes bytecode medians, TS / Rust / reference (Rust process), microseconds:

- Zoned parse: 65.00 /47.03 /51.53.
- Zoned offset: 2.64 /3.29 /0.22.
- Zoned day add: 69.59 /57.11 /31.35.
- Zoned day difference: 114.71 /106.80 /20.79.
- Zoned next transition: 9.81 /5.04 /42.70.

V8 medians, TS / WASM / reference, microseconds:

- Zoned parse: 5.74 /41.60 /6.81.
- Zoned offset: 0.35 /3.51 /0.06.
- Zoned day add: 6.76 /56.62 /3.19.
- Zoned day difference: 13.69 /82.73 /47.40.
- Zoned next transition: 1.21 /5.08 /7.17.

Cached kernels avoid repeated identity normalization while selecting the current
backend per operation. Rust improves four Hermes cases here; offset getters still
cross JSON. The reference caches offsets. WASM loses all five against TS on this
host. These partial-backend timings do not establish a default-backend choice.

Binary: 3,255,057 raw /393,101 gzip bytes. Consumer bundles: TS 360,695 gzip;
WASM JS 362,654 +binary 393,101 =755,755. Separate ESM: TS 362,249 versus WASM
756,154. Both native calendar and timezone packs duplicate retained JS fallback
packs. Native class/relative orchestration remains incomplete.

WASM compile/instantiate costs: 1.56/1.61 ms; first native/calendar/timezone
operations: 2.72/9.70/1.10 ms. JS/TS was already warm; these exclude cold JS loading.

## Native Duration bridge

`hermes-duration-results.json`, `wasm-duration-results.json` and
`duration-backend-size-results.json` extend the same commands to 25 workloads.
Five additions cover Duration parsing, microsecond formatting, addition, relative
rounding and relative totals. Relative cases include month prefixes and alternate
plain/zoned anchors. ISO throughput only; all16 calendar packs remain included.
Parity against temporal-polyfill1.0.7 basic passes before timing. Warmup, sample
counts, transition overrides and Intl providers match the timezone profile.

Hermes bytecode medians, TS / Rust / reference (Rust process), microseconds:

- Duration parse: 13.60 /14.40 /13.65.
- Duration format: 26.97 /8.91 /13.04.
- Duration add + format: 24.09 /45.06 /24.10.
- Relative round + format: 232.82 /69.87 /51.80.
- Relative total: 59.70 /19.57 /14.59.

V8 medians, TS / WASM / reference, microseconds:

- Duration parse: 2.24 /13.30 /1.88.
- Duration format: 2.33 /8.24 /86.50.
- Duration add + format: 4.77 /38.54 /88.58.
- Relative round + format: 26.22 /75.46 /54.77.
- Relative total: 6.13 /20.90 /3.31.

Native relative calculations reduce repeated crossings on Hermes. Parsing and
addition still pay marshalling and result-validation costs. WASM loses all five
against TS here. No default-backend recommendation from this partial profile.

Binary: 3,316,093 raw /410,408 gzip bytes. Consumer bundles: TS 360,908 gzip;
WASM JS 363,260 +binary 410,408 =773,668. Separate ESM: TS 362,728 versus WASM
773,940. Native packs still duplicate retained TS fallback data. Compile and
instantiate: 1.68/1.45 ms; first native/calendar/timezone/Duration calls:
3.15/9.75/1.11/1.58 ms. JS/TS already warm; these exclude cold JS loading.
Remaining date/zoned orchestration, SDK distribution and full-backend artifact
sizes remain open.

## Native plain date arithmetic

`hermes-plain-arithmetic-results.json`, `wasm-plain-arithmetic-results.json` and
`plain-arithmetic-backend-size-results.json` extend the commands to28 workloads.
Existing Date add/difference cases now use high-level Rust operations. Three new
PlainDateTime cases measure add +format, difference +format and round +format.
Differences span one month, three days, two hours and481 nanoseconds; rounding
uses125 microseconds and halfEven. Eight inputs, parity checks, warmup/sample
counts, transition overrides and Intl providers match the Duration profile.
ISO throughput only; all16 owned calendar and IANA packs remain included.

Hermes bytecode medians, TS / Rust / reference (Rust process), microseconds:

- Date add +format:41.45 /29.32 /11.90.
- Date difference +format:58.13 /26.60 /13.97.
- DateTime add +format:51.98 /36.30 /28.83.
- DateTime difference +format:61.43 /27.80 /28.01.
- DateTime round +format:21.07 /19.14 /18.91.

V8 medians, TS / WASM / reference, microseconds:

- Date add +format:5.60 /23.09 /2.19.
- Date difference +format:6.14 /24.47 /24.54.
- DateTime add +format:5.93 /28.81 /5.51.
- DateTime difference +format:6.05 /25.20 /69.12.
- DateTime round +format:1.82 /15.53 /3.78.

Native operations reduce repeated crossings on Hermes; all five cases improve
against TS here. WASM loses all five against TS. One host and partial backend
coverage do not establish a default-backend choice.

Binary:3,335,338 raw /415,898 gzip bytes. Consumer bundles:TS361,031 gzip;
WASM JS363,515 +binary415,898 =779,413. Separate ESM:TS362,922 versus WASM779,625.
Native packs still duplicate retained TS fallback data. Compile/instantiate:
1.70/1.38 ms; first native/calendar/timezone/Duration operations:
3.07/9.79/1.13/1.73 ms. JS/TS already warm; these exclude cold JS loading.
Date parsing/formatting, remaining short-date/zoned orchestration and full native
SDK distribution remain open; these are partial-backend measurements.

## Native zoned arithmetic

`hermes-zoned-arithmetic-results.json`, `wasm-zoned-arithmetic-results.json` and
`zoned-arithmetic-backend-size-results.json` extend the same commands to 31
workloads. Zoned day addition/differences now use typed Rust operations. Three new
cases measure hour rounding with halfEven, startOfDay and hoursInDay. Existing
eight zoned inputs include DST gaps/folds, half-hour and skipped-day changes.
Parity, warmup/sample counts, transition overrides and Intl providers match the
plain-arithmetic profile. ISO throughput only; all 16 native calendar packs and
owned IANA data remain included. Final runs execute sequentially after validation.

Hermes bytecode medians, TS / Rust / reference (Rust process), microseconds:

- Zoned day add: 70.12 /36.35 /31.94.
- Zoned day difference: 117.15 /49.33 /21.30.
- Zoned hour round: 47.68 /9.81 /27.18.
- Zoned day start: 30.06 /18.04 /19.45.
- Zoned hoursInDay: 54.42 /30.00 /8.57.

V8 medians, TS / WASM / reference, microseconds:

- Zoned day add: 6.97 /34.92 /3.45.
- Zoned day difference: 13.84 /52.46 /47.52.
- Zoned hour round: 4.06 /10.28 /3.00.
- Zoned day start: 3.68 /21.10 /1.42.
- Zoned hoursInDay: 4.46 /36.77 /2.20.

All five Hermes cases improve against TS. Reference comparisons vary; hoursInDay
remains substantially faster in the reference. WASM loses all five against TS.
These partial-backend measurements do not establish a default-backend choice.

Binary: 3,345,951 raw /419,656 gzip bytes. Consumer bundles: TS 361,109 gzip;
WASM JS 363,702 +binary 419,656 =783,358. Separately compressed ESM: TS 363,110
versus WASM 783,571. Native packs still duplicate retained TS fallback data.
Compile/instantiate: 1.81/1.59 ms; first native/calendar/timezone/Duration calls:
2.79/9.95/1.28/1.86 ms. JS/TS already warm; these exclude cold JS loading.
Date parsing/formatting, short-date operations, SDK installation/distribution and
native Intl integration remain open. Full-backend artifact sizes remain unproven.

## Native string parsers

`hermes-string-parser-results.json`, `wasm-string-parser-results.json` and
`string-parser-backend-size-results.json` extend the same commands to 35 workloads.
Four new cases parse eight distinct strings and read Date.day, DateTime.nanosecond,
YearMonth.month or MonthDay.day. Existing zoned parsing now uses Rust grammar and
resolution. These measure public operations including getters, rather than isolated
scanners. Parity checks, warmup/sample counts, transition overrides and Intl
providers match the zoned-arithmetic profile. ISO throughput only; all 16 native
calendar packs and owned IANA data remain included. Final runs execute sequentially
after the full 61-target regression passes.

Hermes bytecode medians, TS / Rust / reference (Rust process), microseconds:

- Date parse +day: 10.90 /8.08 /6.97.
- DateTime parse +nanosecond: 16.88 /11.33 /14.70.
- YearMonth parse +month: 21.89 /10.60 /4.11.
- MonthDay parse +day: 11.68 /7.08 /4.82.
- Zoned parse +epoch: 66.37 /38.83 /52.36.

V8 medians, TS / WASM / reference, microseconds:

- Date parse +day: 1.60 /7.83 /2.57.
- DateTime parse +nanosecond: 2.03 /9.18 /4.77.
- YearMonth parse +month: 2.57 /11.89 /0.80.
- MonthDay parse +day: 1.47 /7.74 /1.05.
- Zoned parse +epoch: 5.73 /41.09 /6.83.

All five Hermes workloads improve against TS. Rust DateTime/zoned parsing beats
the reference in this run; reference plain Date/YearMonth/MonthDay parsing remains
faster. WASM loses all five against TS. These partial-backend, one-host profiles
do not establish a default-backend choice.

Binary: 3,382,920 raw /430,091 gzip bytes. Consumer bundles: TS 361,230 gzip;
WASM JS 363,979 +binary 430,091 =794,070. Separate ESM: TS 363,338 versus WASM
794,233. Native packs still duplicate retained TS fallback data. Compile and
instantiate: 1.75/1.40 ms; first native/calendar/timezone/Duration calls:
2.89/10.00/1.74/2.06 ms. JS/TS already warm; these exclude cold JS loading.
Date formatting, short-date arithmetic, native Now host integration, SDK
installation/distribution and native Intl integration remain open. Full-backend
artifact comparisons remain unproven.

## Native date output and short-date bindings

`hermes-date-output-results.json`, `wasm-date-output-results.json` and
`date-output-backend-size-results.json` record 43 matched public workloads.
Eight new cases cover five date formatters, YearMonth difference and both
short-date conversions. Existing YearMonth addition now uses Rust too.
All eight varying inputs pass output parity before timing. Throughput uses ISO;
all16 owned calendar packs and IANA records remain bundled. Reference:
`temporal-polyfill` 1.0.7 basic, with the registered native en/number locale pack
and owned IANA data on Hermes. Host Node Intl serves the V8 reference.

Hermes optimized bytecode medians, microseconds/call. Separate TS/native processes;
1,000 warmup calls and five batches of 5,000. Source results remain in the snapshot.

| Operation       |    TS | Rust bridge | Reference |
| --------------- | ----: | ----------: | --------: |
| dateFormat      |  9.58 |        3.13 |      1.37 |
| dateTimeFormat  | 20.91 |        5.31 |      7.19 |
| yearMonthFormat |  3.35 |        3.17 |      1.47 |
| monthDayFormat  |  3.28 |        3.13 |      1.40 |
| zonedFormat     | 33.17 |        7.32 |     13.60 |
| yearMonthUntil  | 54.94 |       26.40 |     13.62 |
| yearMonthToDate | 17.01 |        5.96 |      8.33 |
| monthDayToDate  | 16.54 |       11.15 |      8.13 |

V8 medians, microseconds/call. Same-process TS, WASM, reference order; 3,000 warmup
calls and seven batches of 10,000. Transition cases retain 128 warmup/512 calls
on both engines. Benchmarks ran serially after regression tests on one host.

| Operation       |   TS | WASM bridge | Reference |
| --------------- | ---: | ----------: | --------: |
| dateFormat      | 1.00 |        3.67 |      0.27 |
| dateTimeFormat  | 1.12 |        4.99 |      2.24 |
| yearMonthFormat | 0.41 |        3.71 |      0.27 |
| monthDayFormat  | 0.37 |        3.55 |      0.27 |
| zonedFormat     | 2.24 |        6.85 |      2.50 |
| yearMonthUntil  | 5.64 |       24.28 |     24.65 |
| yearMonthToDate | 2.66 |        7.10 |      2.37 |
| monthDayToDate  | 2.47 |       12.26 |      2.09 |

Rust improves all eight new Hermes cases versus TS; the reference wins five.
WASM loses all eight against TS on V8. One-host partial-backend measurements do
not establish a default-backend choice.

Binary: 3,416,379 raw /441,577 gzip bytes. Consumer gzip: TS 361,460; WASM JS
364,395 +binary 441,577 =805,972. Separate ESM: TS 363,734 versus WASM 806,115.
WASM retains duplicate native packs and TS fallback data. Compile/instantiate:
1.77/1.60 ms. Hot timings exclude startup; first-use measurements remain in the
snapshot, after JS/TS warmup. Native Now host integration, Hermes SDK distribution,
native Intl integration and full-backend artifact comparisons remain required.

## SDK host providers and default Hermes

`hermes-sdk-host-results.json`, `wasm-sdk-host-results.json`,
`sdk-host-backend-size-results.json` and `native-sdk-host-size-results.json`
record the current 43-workload comparison and delivered bytes. All six Hermes
profiles pass exact output parity for eight varying inputs and share one checksum.
The new SDK profile uses the actual installed namespace without the runner-only
query callback. Reference: `temporal-polyfill` 1.0.7 basic. Throughput uses ISO;
all16 calendar packs and owned IANA records remain included.

Hermes optimized-workload medians, microseconds/call. Each profile uses a separate
process, 1,000 warmup calls and five batches of 5,000. SDK facade setup evaluates
embedded source in both workload modes; only the benchmark workload is precompiled.
Unused imported TS initialization is outside hot timing. These are hot-operation
results, not SDK startup/heap measurements. Reference values below come from the
SDK process. Native en/number locale and owned timezone packs serve the reference.

| Operation       |    TS | Rust bridge |   SDK | Reference |
| --------------- | ----: | ----------: | ----: | --------: |
| parse           |  9.12 |        3.40 |  4.15 |     17.34 |
| format          |  8.89 |        7.95 |  8.87 |      9.50 |
| dateFields      | 22.57 |       41.30 | 50.37 |      1.97 |
| dateTimeFormat  | 20.85 |        5.17 |  6.79 |      7.04 |
| zonedFormat     | 33.06 |        7.31 |  9.17 |     13.47 |
| yearMonthUntil  | 55.36 |       26.48 | 31.62 |     13.44 |
| yearMonthToDate | 17.01 |        5.95 |  7.54 |      8.08 |
| monthDayToDate  | 16.43 |       11.18 | 14.83 |      7.89 |

SDK results vary. DateTime/zoned formatting beats TS and the reference here;
repeated calendar getters lose to both because each property crosses JSON.
Source and full 43-workload results remain in the snapshot. The experimental
bridge and SDK also differ in facade compilation, so report them separately.

V8 medians, microseconds/call. Same-process TS/WASM/reference order, 3,000 warmup
calls and seven batches of 10,000. Transition cases retain 128 warmup/512 calls
on both engines. Host Node Intl serves the V8 reference.

| Operation       |   TS |  WASM | Reference |
| --------------- | ---: | ----: | --------: |
| parse           | 1.67 |  3.13 |      2.92 |
| format          | 0.67 |  7.13 |      1.50 |
| dateFields      | 2.52 | 44.89 |      0.45 |
| dateTimeFormat  | 1.15 |  5.15 |      2.29 |
| zonedFormat     | 2.30 |  7.09 |      2.53 |
| yearMonthUntil  | 5.76 | 24.50 |     24.74 |
| yearMonthToDate | 3.65 |  7.64 |      2.34 |
| monthDayToDate  | 2.59 | 12.44 |      2.46 |

WASM consumer gzip: TS 361,482 bytes versus
JS 364,417 +binary 441,577
=805,994. Separate ESM: TS
363,765 versus WASM
806,146. Binary raw:
3,416,379. WASM retains TS fallback algorithms/data.

The independent SDK consumer builds fully stripped Linux executables with an
identical Hermes/all-twelve-Intl baseline and default compiled locale selection.
Temporal adds 6,865,280 raw /838,100 gzip bytes.
Both complete binaries are large because they include the default Intl locale
data: baseline 462,449,568 raw
/84,348,084 gzip; with Temporal
469,314,848 raw
/85,186,184 gzip. Locale selection changes
that baseline. This is an incremental app-size profile, separate from standalone
JS modules and the multi-architecture SDK download. `readelf` verifies no symbol
or debug tables. Commands and exact scope remain in the snapshot.

Final benchmark commands ran serially after regression/native-size checks on one
host. No default-backend recommendation follows from these partial profiles.
Native Intl Temporal conformance and the full completion audit remain open.

## Native data ownership

`wasm-native-data-results.json` compares the default TS entry, retained-data WASM,
the new `wasm-native.js` entry and temporal-polyfill 1.0.7 basic. All four profiles
pass parity on 43 ISO workloads with eight inputs. V8 uses 3,000 warmup calls and
seven batches of 10,000; transition cases use 128/512. Profiles run in that order
in one process, after regression work. Both WASM profiles share a warmed Rust
instance. Existing first-native timings describe the retained-data profile only.

Consumer gzip: TS 360,710 bytes; retained-data WASM 806,221;
native-data WASM 469,793 (28,216 JS +441,577 binary). Removing duplicate TS tables
saves 336,428 bytes, 41.7%. The native-data payload remains 30.2% larger than TS.
Separate-module totals are 362,975 /805,356 /470,013 bytes respectively. These are
alternative runtime graphs; the npm archive also contains the other entries,
source maps, declarations and WASM asset. No source maps count as runtime imports.

V8 medians, microseconds/call:

| Operation      |   TS | Native-data WASM | Reference |
| -------------- | ---: | ---------------: | --------: |
| parse          | 1.71 |             3.55 |      3.15 |
| dateFields     | 2.47 |            45.22 |      0.45 |
| dateTimeFormat | 1.09 |             4.90 |      2.25 |
| zonedFormat    | 2.24 |             6.89 |      2.47 |
| yearMonthUntil | 5.82 |            24.40 |     24.77 |
| monthDayToDate | 2.66 |            12.25 |      2.26 |

Both WASM profiles lose all 43 workloads to TS here. Keep TS as default.
Native-data builds remove duplicate data; shared JS orchestration and the JSON
boundary remain. Rust binary and ABI9 are unchanged. This is not proof of a
complete Rust backend or native-entry cold startup/heap usage.

`hermes-native-data-results.json` refreshes all six Hermes profiles after the data
change; all checksums equal 30,956,984. Each process uses 1,000 warmup calls and
five batches of 5,000. SDK facade setup evaluates source even for HBC workloads;
unused imported TS initialization stays outside hot timing. These are hot-operation
measurements, not SDK startup/heap results. Source/full results stay in the snapshot.

Hermes HBC medians, microseconds/call; reference from SDK process:

| Operation      |    TS |   SDK | Reference |
| -------------- | ----: | ----: | --------: |
| parse          |  9.14 |  3.91 |     17.07 |
| dateFields     | 22.18 | 48.98 |      1.95 |
| dateTimeFormat | 18.25 |  6.32 |      6.90 |
| zonedFormat    | 30.40 |  8.67 |     13.18 |
| yearMonthUntil | 55.48 | 30.81 |     13.20 |
| monthDayToDate | 16.57 | 14.03 |      7.79 |

`dateTimeFormat` and `zonedFormat` measure Temporal serialization. They do not
measure Intl locale formatting. Data removal alone supplies no hot-speed claim.

`native-sdk-data-size-results.json` measures rebuilt, fully stripped Linux SDK
consumers. Both install all twelve Intl APIs with identical compiled locale data.
Temporal adds 3,570,640 raw /492,729 gzip bytes, versus the earlier
6,865,280 /838,100 profile. This is incremental native app size, with Hermes/Intl
already present; standalone JS/WASM sizes have a different runtime baseline.
The extracted SDK passes source/HBC installation, native Chinese fields, minimum
PlainDate locale formatting and fixed-zero names without a Rust toolchain.
`native-data-backend-size-results.json` records the separate published-module graphs.

Validation: 96 regression targets pass, including SDK/WASM full class gates,
independent authority fixtures, published-package variants and shared bundler
sourcemap checks. Two initial checks timed out under broad parallel load; the
bounded-concurrency rerun passes without timeout or exclusion changes. Rust backend
completion remains unproven; data deduplication does not close that audit.

## Compact calendar default

`compact-calendar-size-results.json` compares the new default with explicit
standalone and the full host-backed reference. Published consumers measure
93,005/361,912 bytes gzip for default/standalone, a 74.3% reduction. Raw-source
Rolldown profiles measure 92,044/361,121; full reference measures 23,226. Default
uses bounded ICU4X Chinese/Dangi data plus arithmetic and host Intl Umm al-Qura.
IANA data remains owned. Both entries expose all 16 calendars.

`compact-calendar-backend-size-results.json` records published ESM graphs:
95,277 bytes gzip for TS, 474,427 for native-data WASM, 537,658 for retained-data
WASM. `wasm-compact-calendar-results.json` measures actual published consumers:
93,005 TS, 474,201 native-data WASM including binary. Alternatives, declarations,
maps and notices also ship in the npm package; these are runtime measurements.

Fresh V8 benchmark: 43 ISO workloads, eight inputs, 3,000 warmup, seven samples
of 10,000 calls (transition cases use their recorded smaller counts). All output
checks pass; checksum 173601476. Neither WASM mode beats TS on a measured median.
Parsing medians are TS 1.636 µs, native-data WASM 3.250 µs, reference 3.008 µs.
Reference field getters remain faster: 0.437 µs versus TS 2.489 µs. These results
do not establish non-ISO throughput or cold TS load time. Existing Hermes speed
snapshots predate this default; new Hermes validation covers the full independent
calendar oracle in source and optimized bytecode.

The default passes 12,228 count-checked class/calendar/Now/installation executions
and the 30,620-row independent calendar corpus. The arithmetic port separately
matches every year, month, serial and yearly final-month inverse across the old
full packs: 1,204,680 years and 14,899,816 months. Full Temporal/Intl completion
remains pending.

## Compact timezone histories

`compact-timezone-size-results.json` measures published default/standalone
consumers at 64,645/333,124 bytes gzip. Default drops 30.5% from the previous
93,005-byte calendar profile. Raw-source profiles measure 63,681/332,340; full
host-backed reference remains 23,226. These remain different timezone-data
policies: TS owns exact finite histories and future rules; reference uses Intl.
DateTimeFormat retains its abbreviation/DST data and does not add this pack.

`compact-timezone-backend-size-results.json` records separately compressed
module graphs: 66,933 bytes for TS, 474,202 for native-data WASM, 509,314 for
hybrid WASM. `wasm-compact-timezone-results.json` records bundled consumers:
64,645 TS and 473,973 native-data WASM, including the same 441,577-byte gzip
binary. Neither WASM mode wins any of the 43 measured ISO workload medians;
reference wins 20. All output checks pass; checksum 173601476. Parse medians:
TS 1.701 µs, native-data WASM 2.893 µs, reference 2.509 µs. Date-field getters
remain slower than reference: TS 2.514 µs versus 0.435 µs.

The default passes all 12,228 count-checked class/calendar/Now/installation
executions. Independent Hermes source and optimized-bytecode checks each cover
597 names, 178,503 identity pairs, 17,640 offsets, 1,900 gap/fold windows and
14,058 strict transition rows. Generator/runtime reconstruction preserves all
19,793 retained finite events across 457 concrete zones, including final
cutoffs and future rules. These checks do not complete the remaining Intl/Rust
audit or establish cold TS load time, Hermes throughput or non-ISO throughput.

## DurationFormat integration

`durationformat-integration-size-results.json` refreshes installer/module sizes
after late Temporal registration and legacy host adaptation. Separate TS and
standalone graphs remain 66,933/335,404 bytes gzip. Native-data WASM glue plus its
unchanged 441,577-byte gzip binary measures 475,345, up from 474,202. These are
separately compressed modules, not consumer bundles. No new throughput run;
the compact-timezone timing snapshot remains the prior numeric-path measurement.

## Extended Gregorian host formatting

`extended-date-size-results.json` measures published default/standalone consumers
at 65,121/334,194 bytes gzip after adding extended Gregorian single/range
formatting. `extended-date-backend-size-results.json` records separate module
graphs: 67,389 TS, 475,835 native-data WASM, 509,770 hybrid WASM, including the
unchanged binary for WASM. No new throughput run. Validation covers 72 clipping
Test262 executions across Node TS/WASM and Hermes source/bytecode, plus independent
ICU Gregorian field/range controls in five numeral systems. That layer left host
lunar consistency and non-Gregorian clipping open; the correction below closes
the lunar mismatch.

## Lunar host formatting

`lunar-intl-size-results.json` and `lunar-intl-backend-size-results.json` refresh
consumer and module sizes after correcting stale host Chinese/Dangi fields.
The correction shares Temporal's calendar data; captured Intl supplies localized
labels and interval separators. No locale packs are added. Previous throughput
snapshots remain historical; this change does not measure new Intl timings.
Published default/standalone consumers measure 65,516/333,671 bytes gzip.
Separate graphs measure TS 67,789, native-data WASM 478,860 and hybrid WASM
511,771, including the rebuilt 443,178-byte gzip binary for WASM. These refreshes
also include the preceding Rust field-update layers.

Validation covers 520 full legacy formatter Test262 executions across Node
TS/WASM and Hermes source/bytecode, plus four Hermes fault-injection executions.
The published-package oracle checks 8,708 independent ICU field rows, localized
labels and ranges. Existing 30,620-row calendar controls remain strict. Calendar
arithmetic/data are unchanged; non-Gregorian legacy TimeClip remains open.

## Extended non-Gregorian host formatting

`extended-calendar-size-results.json` measures default/standalone consumers at
67,740/336,247 bytes gzip, increases of 2,224/2,576 over the lunar layer.
Host Intl supplies labels; Temporal restores calendar fields beyond Date TimeClip.
Only Before Hijrah labels add CLDR locale data, with inheritance deduplication.
`extended-calendar-backend-size-results.json` records separate graphs: TS 70,018,
native-data WASM 481,274 and hybrid WASM 514,000 bytes gzip. WASM totals include
the unchanged 443,178-byte gzip binary. The host-Intl full reference remains
23,226 bytes gzip. Default TS still includes owned timezone data.

Validation covers 60 independent ICU boundary rows across ten calendars,
1,515 public formatting checks per TS/WASM profile, and 300 checks per Hermes
source/bytecode mode. All fourteen non-Gregorian calendars have range controls;
the existing independent-oracle limits for four calendars remain explicit.
A constructor-count regression checks warmed formatting across four calendars
without new Intl construction. No fresh throughput claim.

All 37 focused regression targets pass with four concurrent tests. Unbounded
local concurrency hit two 30-second numeric-Date comparison timeouts; those
cases bypass the new plain renderer. Case timeouts and exclusions are unchanged.

## Legacy calendar eras and BCE probes

`era-intl-size-results.json` measures default/standalone consumers at
68,089/336,635 bytes gzip, increases of 349/388. This adds no calendar data.
`era-intl-backend-size-results.json` records separate graphs: TS 70,411,
native-data WASM 481,677 and hybrid WASM 514,393 bytes gzip, including the
unchanged 443,178-byte gzip binary for WASM. Reference full remains 23,226 using
host Intl; ours still includes owned timezone data. No new throughput claim.

Numeric Date/Instant formatting and ZonedDateTime locale methods restore owned
calendar fields and eras while retaining host clock and timezone parts. BCE
probes use Gregorian eras, explicit Latin digits and captured era labels.
Validation includes 81 independent ICU rows across nine calendars and 936
locale/timezone combinations per TS/WASM/Hermes profile, plus forced Arabic
probe fallback and host-boundary failure controls. All 43 regression targets
pass with four concurrent tests and unchanged case timeouts/exclusions.

## Rust zoned replacements and partial Intl startup

`rust-zoned-replacements-size-results.json` refreshes default/standalone consumers
at 68,089/336,635 bytes gzip. `rust-zoned-replacements-backend-size-results.json`
records separate TS/native-data WASM/hybrid graphs at 70,411/481,677/514,393.
The WASM binary still measures 443,178 bytes gzip. All compressed totals match
the previous snapshot. No new throughput claim.

Rust adds typed clock/timezone replacements. A missing optional-constructor guard
also blocked Hermes SDK startup with partial Intl; the import regression now
covers partial, empty and absent Intl through installation. Sixteen focused gates
pass, including 1,804 ZonedDateTime Test262 executions per TS/WASM/Hermes SDK
source/bytecode profile. Independent ICU cases cover 17,640 offsets, 1,900 gap/fold
windows and 5,292 day boundaries through the new Rust methods.

## Lunar boundary audit refresh

`lunar-boundary-facade-results.json` refreshes 26 Node workloads against forced
`temporal-polyfill/full/implementation` 1.0.7, including Chinese/Dangi/Umm al-Qura
month addition. TS wins 16 measured medians; reference wins ten. Output parity passes.
`lunar-boundary-wasm-results.json` refreshes 43 ISO workloads against the basic
reference: TS wins 21 medians, reference 22; neither WASM profile beats TS.
The checksum remains 173601476. These sequential single-machine samples exclude
JS cold startup; no new Hermes timing claim.

`lunar-boundary-backend-size-results.json` records separately compressed module
graphs: TS 70,443, standalone 338,952, native-data WASM 481,746 and hybrid WASM
514,425 bytes gzip. WASM totals include the unchanged 443,178-byte gzip binary.
Full reference bundle remains 23,226 and uses host Intl; default TS includes owned
IANA data. The matched WASM benchmark consumer bundles measure 68,138 TS and
481,452 native-data WASM including binary. Consumer bundles and module sums are
alternative delivery modes. Published module payload is not whole npm archive size.

The runtime fix recovers Chinese/Dangi formatting at valid Date bounds and rejects
reversed fallback ranges. Shared boundary controls pass on TS, both WASM entries
and Hermes source/HBC. All 53 final conformance/boundary gates pass. This does not
close the remaining host timezone data mismatch or Rust public conversion audit.

## Rust PlainDate zoned conversion

`rust-date-zoned-backend-size-results.json` refreshes size after extracting the
shared day-boundary algorithm for the typed Rust API. TS and standalone module
graphs remain 70,443/338,952 bytes gzip. Native-data WASM totals 481,666; hybrid
514,345, including the 443,098-byte gzip binary. No new throughput claim.
Twelve focused regression targets pass, including 7,216 zoned Test262 executions.

## Host timezone formatting

`host-timezone-formatting-size-results.json` measures the legacy host correction
for stale timezone rules and missing identifiers, including localized numeric
offset fallback. Separate graphs: TS 72,018, standalone 342,376, native-data WASM
482,767, hybrid WASM 515,920 bytes gzip. TS adds 1,575 bytes over the Rust date
conversion snapshot. The binary remains 443,098; no generated data changes.
Full host-backed reference bundle remains 23,226. Earlier timing runs are unchanged.

## WASM bridge cost diagnosis (before binary records, 2026-11-17)

Run `bazel run -c opt //benchmarks/temporal:wasm_cost_benchmark`;
append `-- --reverse` to reverse WASM/replay timing order. The optional
`-- --assert-competitive` flag checks whether the legacy JSON path exceeds the threshold when
running the eight-getter workload (twice TS time). It is a diagnostic, not a CI
performance gate.

`wasm-cost-results.json` and `wasm-cost-reverse-results.json` record Node 24.14.0,
V8 13.6 on Xeon Platinum 8488C. Eight varying ISO inputs, 2,000 warmup calls,
seven batches of 4,000. Public outputs match TS before timing; raw/preallocated
and numeric controls match production bridge responses. Both historical runs have checksum 757365000. The separate pre-change 43-workload baseline loses every median to TS. Snapshots predate cached results and binary records; rerunning this diagnostic now exercises the retained JSON control path with current facade caching.

Microseconds/call, forward run:

| Public workload         |   TS |  WASM | Recorded-response replay | Logical backend queries |
| ----------------------- | ---: | ----: | -----------------------: | ----------------------: |
| Instant parse           | 2.20 |  3.37 |                     1.33 |                       1 |
| Instant format          | 0.96 |  7.39 |                     2.21 |                       2 |
| Instant add             | 2.54 | 16.52 |                     7.79 |                       2 |
| PlainDate year          | 0.33 |  4.06 |                     1.09 |                       1 |
| Eight PlainDate getters | 2.64 | 47.05 |                    12.81 |                      13 |

The eight getters issue eight identical `calendarFromEpochDay` requests, one
`calendarDaysInMonth`, one `calendarMonthsInYear` and three
`calendarStartOfYear` requests. Formatting rounds at quantum one before its
format query. Addition validates ten decimal-string duration fields, then sends
the same fields again for arithmetic. `native.ts` builds normalized objects and
JSON; `wasm.ts` encodes/copies input, allocates input plus output descriptor,
decodes the response and frees three allocations. A successful logical query
uses six JS/WASM exported-function calls. Rust also parses/serializes dynamic
`serde_json::Value` records and allocates the result. Repeated calls multiply
these costs; replay preserves JS normalization/JSON and replaces Rust with an
exact recorded-response Map lookup, so it is a control rather than a candidate
production backend.

For one `calendarFromEpochDay` request, the production string bridge takes
2.83 microseconds. Preallocated input/output-descriptor storage, without input
encoding/copy or output decoding, takes 1.91; Rust JSON, calculation, output
allocation and output freeing remain. A benchmark-only numeric ABI calling the
production Rust calendar provider takes 0.36 including JS reconstruction of the
same JSON response, or 0.074 for the call plus reading four numeric fields.
Reverse-order results are 2.87 /1.87 /0.39 /0.076. These independently timed
layers are not additive. The numeric control is ISO-only; it omits textual
calendar lookup, general dispatch, dynamic records and generic error handling.
It does not establish full facade speed or an ABI ready to ship.

Bazel aquery confirms the actual wasm32 `with_ffi` library uses
`--codegen=opt-level=3`; the final export shim uses `-Copt-level=z`. This is an
optimized build. No compiler-option experiment establishes zero effect from
size optimization, but it cannot explain the observed JS replay overhead.

Priorities: reduce duplicate getter queries, use typed numeric records/reused
buffers, and combine normalization/validation/arithmetic or rounding/formatting
where observable JS semantics permit. Removing JS correctness checks is not a
performance plan. Keep TS as default until a complete facade demonstrates a win;
these ISO results do not predict other engines or heavier calendar workloads.

## Binary Rust operations (2026-11-17)

`binary-operation-results.json` compares 48 matched public workloads with
`temporal-polyfill` 1.0.7 basic and `@js-temporal/polyfill` 0.5.1. Run
`bazel run -c opt //benchmarks/temporal:wasm_facade_benchmark`.
Eight varying inputs, output parity checked before timing, 3,000 warmup calls,
seven batches of 10,000; transition workloads use 128/512. Node 24.14.0,
V8 13.6, ICU 78.2, Xeon Platinum 8488C. Profiles run sequentially in one process;
these are workload samples, not a cross-engine ranking.

Microseconds/call; WASM uses the native-data entry:

| Workload              | Our TS |   WASM | temporal-polyfill basic | @js-temporal/polyfill |
| --------------------- | -----: | -----: | ----------------------: | --------------------: |
| parse                 |  1.584 |  2.596 |                   2.947 |                 4.552 |
| format                |  0.695 |  3.029 |                   1.485 |                 6.326 |
| add                   |  2.265 |  7.334 |                   1.463 |                 5.864 |
| dateParse             |  1.659 |  9.442 |                   2.315 |                 1.779 |
| dateFields            |  2.644 |  0.614 |                   0.452 |                 1.962 |
| dateAdd               |  5.845 | 16.045 |                   2.244 |                 5.016 |
| dateWith              |  3.790 | 12.753 |                   1.536 |                 4.148 |
| zonedWith             |  9.565 | 26.594 |                   6.402 |                43.324 |
| zonedAddDay           |  6.274 | 23.847 |                   3.588 |                22.781 |
| zonedRound            |  3.038 | 18.851 |                   2.865 |                30.852 |
| zonedHoursInDay       |  2.849 |  0.058 |                   2.193 |                45.082 |
| durationRoundRelative | 24.049 | 23.869 |                  53.696 |                65.126 |

WASM wins 4/48 sampled workloads against our TS, 13/48 against basic reference,
18/48 against official reference. Eight cached PlainDate getters fall from the
pre-change 45.653 microseconds to 0.614; Instant formatting from 6.998 to 3.029,
addition from 16.431 to 7.334. Construction and snapshot calculation are measured
separately by `dateParse`; cached getter speed includes that cost earlier in the
object's lifetime. Full snapshots add eager work to parse/arithmetic. Rust still
allocates dynamic normalized records internally.

ABI 10 replaces text transfer with reusable binary buffers. Date-like results
carry calendar/clock/zone snapshots; result getters make no extra WASM calls.
Date addition and the five date-like partial-update routes execute one Rust
operation. Instant formatting fuses rounding and offset lookup. Rust timezone
resolution remembers sixteen common historical offsets instead of retrying the
same offsets at every transition; larger histories retain every distinct offset.
This reduces zoned `.with()` from 76.913 microseconds in the initial full-result
experiment to 26.594. TS remains the default.

`binary-operation-startup-results.json` records nine fresh processes per profile,
rotating profile order with persistent V8 compile cache disabled. Run
`bazel run -c opt //benchmarks/temporal:startup_benchmark` after throughput finishes.
The common readiness metric stops after import/setup, first Instant operation
and New York conversion; optional Chinese work follows it. No Node bootstrap in
this metric. Matching Node-target es2022 namespace consumers, gzip level 9:

| Consumer          | JS gzip bytes | WASM gzip bytes | Total bytes | Common readiness ms |
| ----------------- | ------------: | --------------: | ----------: | ------------------: |
| typescript        |        39,693 |               0 |      39,693 |               19.50 |
| nativeDataWasm    |        29,560 |         458,210 |     487,770 |               24.23 |
| hybridWasm        |        44,730 |         458,210 |     502,940 |               25.06 |
| referenceFull     |        23,083 |               0 |      23,083 |               19.37 |
| referenceBasic    |        19,275 |               0 |      19,275 |               18.87 |
| officialReference |        44,522 |               0 |      44,522 |               26.75 |

WASM owns sixteen calendars and IANA histories/future rules; TS and references
use host Intl data. The throughput snapshot also reports browser-target bundles
that re-export complete entries, including installers. Those payloads differ
from the Node namespace consumers above; native-data WASM totals 490,724 bytes
there, including 32,514 bytes of JS. Whole npm archive size is a separate measure.

Official 0.5.1 throws `RangeError: Unexpected leap month suffix: Mo1` for the
Chinese month-addition startup sample on ICU 78.2. Its optional calendar sample
is disabled and recorded explicitly; its ISO/timezone readiness remains matched.
Full-calendar readiness comparisons exclude both officialReference and the
calendar-free basic reference. Throughput workloads here are ISO/timezone cases.

All 55 focused correctness targets pass: default TS class gates, twelve WASM
Test262 suites, twelve native SDK suites in both Hermes source/bytecode modes,
package/ICU oracle checks, strict types and Rust tests. Each WASM/SDK profile
executes 12,234 Test262 scenarios, with unchanged exclusion manifests. Rust unit
checks include repeated-offset elimination, histories with forty distinct offsets,
malformed binary requests, nanosecond precision and recovery after errors.

## Typed WASM hillclimb (2026-11-17)

`hillclimb-results.json` reruns the same 48 public workloads after ABI 11.
`hillclimb-startup-results.json` repeats nine fresh processes per profile.
Environment, output parity, warmup and sampling match the ABI 10 baseline above;
correctness tests finish before timing. `hillclimb-experiments.json` records local
iterations, including discarded experiments. No Hermes/browser speed claim.

Microseconds/call; baseline is commit `b4967794b9b3085564ce36ca7e792919005435e0`:

| Workload              | ABI 10 WASM | ABI 11 WASM | Our TS | temporal-polyfill basic | @js-temporal/polyfill |
| --------------------- | ----------: | ----------: | -----: | ----------------------: | --------------------: |
| parse                 |       2.596 |       0.627 |  1.573 |                   2.898 |                 4.565 |
| format                |       3.029 |       0.746 |  0.665 |                   1.518 |                 6.420 |
| add                   |       7.334 |       2.878 |  2.276 |                   1.412 |                 5.723 |
| dateParse             |       9.442 |       3.144 |  1.598 |                   2.606 |                 1.774 |
| dateFields            |       0.614 |       0.613 |  2.462 |                   0.453 |                 1.969 |
| dateAdd               |      16.045 |       8.706 |  5.929 |                   2.178 |                 5.246 |
| dateWith              |      12.753 |       8.687 |  3.664 |                   1.809 |                 4.148 |
| zonedWith             |      26.594 |      21.207 |  9.543 |                   6.273 |                43.178 |
| zonedAddDay           |      23.847 |      18.321 |  6.213 |                   3.375 |                22.601 |
| zonedRound            |      18.851 |      13.113 |  2.936 |                   2.875 |                30.561 |
| zonedHoursInDay       |       0.058 |       0.059 |  2.732 |                   2.184 |                44.975 |
| durationRoundRelative |      23.869 |      24.160 | 24.270 |                  52.720 |                64.556 |

WASM has the lower sampled median in 5/48 workloads against our TS,
14/48 against basic reference, 20/48 against official reference.
Cached getters still move work into construction; parse/add/with rows include
construction of the resulting value. TS remains the default.

Seven hot routes bypass dynamic request maps. Instant inputs/results use signed
128-bit nanoseconds; formatting streams text into the reused output buffer.
Date parsers/addition use typed inputs. Calendar/clock/zone results use fixed
Rust snapshots, shared with SDK JSON serialization. Other operations retain the
generic request codec. No added data or dependencies.

Borrowed Rust-only Instant decoding helped, but JS objects/decimal transfer
still dominated. Typed inputs removed that cost; fixed snapshots removed the
next allocation layer. Binding generic JS DataView calls showed no useful gain.
Fixed-shape JS snapshot decoding slowed date parse/add and was discarded.

Matched Node namespace consumers, gzip level 9; common ISO/timezone readiness:

| Consumer          | JS gzip bytes | WASM gzip bytes | Total bytes | Readiness ms |
| ----------------- | ------------: | --------------: | ----------: | -----------: |
| typescript        |        39,693 |               0 |      39,693 |        19.37 |
| nativeDataWasm    |        30,542 |         462,516 |     493,058 |        24.44 |
| hybridWasm        |        45,724 |         462,516 |     508,240 |        25.41 |
| referenceFull     |        23,083 |               0 |      23,083 |        19.22 |
| referenceBasic    |        19,275 |               0 |      19,275 |        18.82 |
| officialReference |        44,522 |               0 |      44,522 |        26.71 |

Native-data consumer changes from 487,770 to 493,058 gzip bytes: 982 added JS
bytes and 4,306 binary bytes (1.1% total). No sampled WASM route regresses by
more than both 10% and 0.1 microseconds in this run.
WASM still owns calendar/IANA data; TS and references use host Intl. Browser
full-entry consumers use a different bundle scope: native-data JS plus binary
is 495,973 gzip bytes. Whole archive size is separate.
The official reference's Chinese startup incompatibility described above remains
recorded; only shared ISO/timezone readiness is compared.

All 62 final targets pass: the previous 55 gates, three Hermes native oracle
checks, SDK Intl compatibility in source/bytecode, and both WASM Intl profiles.
The wider suites caught historical offset strings rounded to minutes and a
non-ISO MonthDay TypeError mismatch; both are fixed without new exclusions.
Snapshots preserve exact offsets; `.toString()` retains minute rounding.
Oracle fault injection follows fused snapshot operations, preserving backend
error propagation. Signed nanosecond bounds, malformed/trailing records and
recovery remain covered.

## CPU profile follow-up (2026-11-17)

`profile-results.json` contains baseline V8 self-time attribution, with optimized
Rust names retained. Instant addition spends about 70% in JS (coercion, validation,
bindings and object creation), versus 13% in WASM. Date parsing spends about 65%
in JS and 13% in GC. Zoned updates spend 61% in Rust. Baseline field construction and
DateTime operations allocated/hashed dynamic records. These profiles include
setup/warmup; inspector bookkeeping is excluded. Runtime helpers have their own
bucket. Percentages are attribution, not additive layer benchmarks.

To inspect a CPU profile:

```sh
FORMATJS_TEMPORAL_BENCHMARK_PROFILE=nativeDataWasm \
FORMATJS_TEMPORAL_BENCHMARK_FILTER=zonedWith \
FORMATJS_TEMPORAL_PROFILE=nativeDataWasm \
FORMATJS_TEMPORAL_PROFILE_OUTPUT=/tmp/temporal-zoned.cpuprofile \
bazel run -c opt --define=temporal_wasm_profile=true //benchmarks/temporal:wasm_facade_benchmark
```

Profile mode uses at least 50,000 iterations per sample. Load the resulting file
in DevTools. Named builds change payload size; use ordinary stripped builds for
shipping measurements and disable profiling for throughput.

ABI 12 removes duplicate Instant validation, repeated ISO field-list allocation,
redundant snapshot cache entries and hot dynamic records. Rust returns complete
compact ISO date results; date field updates reuse public Rust methods. Typed
bindings also cover date/short-date formatting. Rust Instant formatting writes a
bounded ASCII buffer rather than formatting each field through generic machinery.
Non-Instant duration paths keep JS validation before observable options getters.

The old shared-process harness showed JIT-tiering variance on tiny operations.
`profile-hillclimb-results.json` now uses a fresh process per retained profile,
20,000 warmup calls and nine samples of 50,000 calls, with the same eight inputs
and parity checks. Transition counts are 1,000 warmup and nine samples of 5,000.
TS and unchanged references came from the immediately preceding isolated run;
native-data WASM was retimed after the Rust numeric correction. Hybrid throughput
is omitted; startup/size still cover both WASM profiles. Default fast diagnostics
retain the historical 3,000/7x10,000 counts.

Use `FORMATJS_TEMPORAL_BENCHMARK_PROFILE` to select `typescript`, `wasm`,
`nativeDataWasm`, `reference` or `officialReference`. Counts are configurable with
`FORMATJS_TEMPORAL_BENCHMARK_ITERATIONS`, `FORMATJS_TEMPORAL_BENCHMARK_WARMUP`,
`FORMATJS_TEMPORAL_BENCHMARK_SAMPLES`, `FORMATJS_TEMPORAL_TRANSITION_ITERATIONS`
and `FORMATJS_TEMPORAL_TRANSITION_WARMUP`. Keep them identical across profiles.

Current microseconds per public workload:

| Workload            |    TS | Native-data WASM | temporal-polyfill basic | @js-temporal/polyfill |
| ------------------- | ----: | ---------------: | ----------------------: | --------------------: |
| parse               | 1.555 |            0.875 |                   1.965 |                 4.338 |
| format              | 0.628 |            0.486 |                   1.322 |                 6.242 |
| add                 | 2.225 |            1.235 |                   1.474 |                 5.687 |
| round               | 0.548 |            0.797 |                   0.648 |                 4.171 |
| dateParse           | 1.655 |            1.322 |                   1.736 |                 1.885 |
| dateFromFields      | 1.419 |            1.771 |                   1.009 |                 3.371 |
| dateWith            | 3.725 |            2.185 |                   1.595 |                 4.166 |
| dateAdd             | 6.143 |            3.306 |                   2.143 |                 5.027 |
| yearMonthWith       | 3.735 |            2.350 |                   1.169 |                 2.927 |
| monthDayWith        | 4.156 |            2.299 |                   1.455 |                 3.802 |
| dateTimeRoundFormat | 1.699 |           10.403 |                   3.663 |                 4.194 |
| zonedTransition     | 0.417 |            4.367 |                   6.742 |               417.477 |

WASM has lower medians in 15/48 against TS, 16/48 against basic reference,
28/48 against official reference. Close medians remain noisy; this is an
ongoing hillclimb, not an all-workload win. Parsing/updates improved, while general
DateTime, timezone, duration and difference routes still dominate remaining work.

`profile-startup-results.json` uses nine fresh processes per profile. Node
namespace gzip: TS 39,691; native-data WASM 497,987
(31,487 JS + 466,500 binary). This adds
4,929 bytes over the previous ABI 11 Node snapshot. Shared ISO/timezone
readiness medians: TS 19.39 ms; WASM
24.99 ms. Data scopes still differ: default TS uses
captured Intl; WASM owns calendars/timezones. Browser consumer sizes are recorded
separately in the throughput file.

`ts-regression-guard.json` compares the current pure TS consumer with commit
872fdaee. Both have 141,410 minified bytes and identical scope-normalized ASTs;
2,560 bindings were normalized. Local minified names change gzip by two bytes.
No TS algorithms or data were changed. New shared spec controls caught a Rust
normalization bug for very large finite calendar fields; fixed before this WASM
snapshot. Required-field errors, non-finite values and `reject` remain checked.
The controls do not count as independent ICU rows. Existing exclusions are unchanged.

### Deferred table initialization

ISO lookups previously initialized and validated Chinese, Dangi and Umm al-Qura
tables. ISO now resolves directly; first non-ISO use retains table validation.
`lazy-calendar-startup-results.json` records nine new processes per profile:
ISO/timezone readiness falls from 25.0 ms to 16.3 ms, versus TS 19.5 ms. First
Chinese use rises from 2.0 ms to 10.7 ms. Full calendar readiness stays about 27 ms.
No data or correctness checks removed. Earlier figures above remain checkpoint
measurements before this change; this experiment measures startup separately.

### Direct DateTime bindings

ABI 13 adds typed DateTime parse/add/round/format routes. Complete ISO results
contain 48 bytes, including signed nanoseconds, calendar properties and six clock
fields. Non-ISO snapshots preserve deferred errors. Instant and DateTime share a
bounded ASCII formatter. Fixed snapshot literals avoid inherited clock setters
and era getters; public regression controls reproduced both failures before fixes.

`date-time-hillclimb-results.json` retimes all 48 WASM workloads with 20,000 warmup
and nine samples of 50,000 calls (transitions retain their smaller count). TS and
pinned reference controls come from the prior isolated run; their executable code
is unchanged. Close medians remain noisy. Times below are microseconds per call.

| Operation           | Earlier WASM | Current WASM |    TS |
| ------------------- | -----------: | -----------: | ----: |
| dateTimeParse       |        6.745 |        2.642 | 2.596 |
| dateTimeAdd         |       13.694 |        3.848 | 5.942 |
| dateTimeRoundFormat |       10.403 |        2.583 | 1.699 |
| dateTimeFormat      |        3.833 |        0.914 | 1.111 |
| dateTimeWith        |       11.387 |        8.528 | 6.290 |
| dateTimeUntil       |       15.816 |       15.602 | 6.199 |

Current WASM wins 16/48 against TS, 20/48 against temporal-polyfill 1.0.7,
and 31/48 against @js-temporal/polyfill 0.5.1. Remaining workloads still slower;
the all-workload goal stays open. Earlier sections retain their checkpoint data.

`date-time-startup-results.json` records nine fresh processes per profile. Current
Node namespace payload: 498,611 bytes gzip including WASM. ISO/timezone readiness
16.40 ms; full calendar readiness 27.04 ms. Browser export-all consumer
sizes remain separate. `ts-regression-guard.json` confirms the unchanged executable
TS AST after local identifier renaming. Rust/core, DateTime/Instant Test262,
WASM package/ICU and native Hermes source/bytecode checks pass; no new exclusions.

### Typed clocks and numeric slots

ABI 14 adds typed clock parsing, regulation, arithmetic, rounding, differences and
duration formatting. Complete clock records use 18 bytes; duration records use
81 bytes. Rust computes all fields. Native clocks store exact Number nanoseconds
and six fields in one WeakMap; other Temporal types receive BigInt lazily. Clock
values are below 2**47 ns, so transport remains exact. Public slots stay private.

`time-profile-results.json` shows the earlier Time.until path spending about 15%
in duration construction, plus substantial generic encoding/decoding and map work.
Rust already rounds duration fields to Number-representable integers and validates
them; the binding now constructs that returned value directly. Typed formatting
avoids another dynamic-record round trip. Rust Instant/DateTime/Time share the
bounded ASCII formatter. Native-width operations apply only after clock range
validation; shared rounding keeps i128 results and a wide-operand fallback.

The u64 PlainTime storage experiment had no stable overall gain in isolated ABBA
runs and was discarded. Private storage/public nanosecond APIs remain i128.
`time-storage-experiments.json` retains the evidence; `time-experiments.json`
records the other trials. Short shared-process numbers are diagnostic only.

`time-hillclimb-results.json` refreshes both TS and native-data WASM in separate
processes: eight inputs/parity, 20,000 warmup and nine samples of 50,000 calls
(transitions retain their smaller counts). Unchanged pinned reference timings
come from the previous isolated run. Times below are microseconds per call.

| Operation           | Earlier WASM | Current WASM | Current TS |
| ------------------- | -----------: | -----------: | ---------: |
| timeParse           |        2.581 |        0.838 |      1.311 |
| timeFormat          |        2.832 |        0.377 |      0.770 |
| timeAdd             |        6.602 |        1.280 |      2.622 |
| timeRoundFormat     |        6.548 |        1.127 |      1.471 |
| timeUntil           |       13.934 |        2.382 |      2.785 |
| round               |        0.821 |        0.793 |      0.467 |
| dateTimeRoundFormat |        2.583 |        2.575 |      1.600 |

All five PlainTime workloads beat TS in this run. Overall WASM wins
22/48 against TS, 24/48 against temporal-polyfill 1.0.7 and 35/48 against
@js-temporal/polyfill 0.5.1. Remaining workloads still slower; the goal stays open.
Close medians need further evidence. Earlier sections retain checkpoint data.

`time-startup-results.json` records nine fresh processes per profile. Node
namespace gzip payload: 500,093 bytes including WASM, versus TS 39,690 bytes.
ISO/timezone readiness: WASM 16.66 ms, TS 19.37 ms.
Full calendar readiness: WASM 27.32 ms. Owned calendar/timezone data remain in
Rust; TS uses host Intl. Browser export-all consumer sizes are separate.

63 focused Rust/TS/WASM/ICU/Hermes targets pass. Final controls cover clock
ownership after WASM memory growth, captured slot lookups, SDK legacy midnight
carry and lazy BigInt interoperability. No new conformance exclusions. Full
owned-Intl WASM coverage remains in CI.

The executable TS AST still matches baseline after local binding renaming. The
checked-in guard strips parser metadata (including raw/source-position fields),
retains globals/properties/literal values, and rejects an unintended intrinsic
capture as a negative control. Existing captures keep their original timing.
`ts-regression-guard.json` records hashes and the control. Save both consumer
bundles with `FORMATJS_TEMPORAL_TS_BUNDLE_OUTPUT` when running the harness, then:

```sh
bazel run -c opt //benchmarks/temporal:ts_regression_guard -- /tmp/baseline.js /tmp/current.js
```

Babel is an existing development dependency, used only by this audit target.

### Compact Instant transport

The ABI 14 rounding profile spends 25.9% of self time in Instant construction,
13.5% in GC and 11.0% in Rust. ABI 15 removes duplicate JS range checks when
wrapping validated Rust results/private branded values. Numeric user constructors
keep validation. Compact integer results use 9 bytes for signed i64, otherwise
17 bytes for i128. Optional scalar rounding returns BigInt directly; i64::MIN
requests checked buffered fallback for errors, wide results and the reserved value.
Engines without scalar i64 interop use the same buffer path. Rust performs all
rounding/validation through its public Instant API; JS keeps observable coercions.

Pointer/direct/direct/pointer isolated trials reduce scalar-result median time
from 655–667 ns to 576–586 ns. Native-width increment validation showed no stable
gain and was discarded. `instant-experiments.json` retains both trials and shorter
diagnostic stages; `instant-profile-results.json` retains the baseline profile.

`instant-hillclimb-results.json` refreshes TS/native-data WASM in separate processes,
eight varying inputs/parity, 20,000 warmup and nine samples of 50,000 calls
(transitions keep their smaller counts). Unchanged pinned reference timings come
from `time-hillclimb-results.json`. Times below are microseconds per call.

| Operation           | Earlier WASM | Current WASM | Current TS |
| ------------------- | -----------: | -----------: | ---------: |
| parse               |        0.885 |        0.939 |      1.562 |
| format              |        0.515 |        0.514 |      0.649 |
| add                 |        1.237 |        1.244 |      2.226 |
| round               |        0.793 |        0.416 |      0.563 |
| dateTimeRoundFormat |        2.575 |        2.617 |      1.640 |

This run records 24/48 WASM wins against TS, 25/48 against temporal-polyfill 1.0.7
and 36/48 against @js-temporal/polyfill 0.5.1. Longer isolated rounding controls
still lose to TS (576–588 ns versus 517–535 ns); the apparent rounding win above
is unstable. The all-workload goal remains open. Earlier sections retain checkpoints.

`instant-startup-results.json` measures nine fresh processes/profile: Node namespace
payload is 500,581 bytes gzip including WASM, 488 above the previous checkpoint;
TS remains 39,690. Native ISO/timezone readiness is 16.85 ms versus TS 19.39 ms;
full calendar readiness is 27.47 ms. Browser export-all payload is measured
separately (503,581 bytes gzip). Default TS uses host Intl; WASM owns timezone and
calendar data. The Bazel AST guard confirms unchanged executable TS structure and
retains the negative control. No new exclusions.

All 63 focused Rust/TS/WASM/ICU/Hermes targets pass after the Instant changes,
including public types, scalar fallback and signed/full-range controls. Full
owned-Intl WASM conformance remains a CI gate. No new exclusions.

### Typed timezone transitions

ABI 15 profiles attribute 58% of zoned parsing and 51% of transition self time to
Rust, with roughly 34% in JS for both. Transition queries still encoded dynamic
maps/decimal BigInts; recurring-rule checks recomputed the same yearly events for
before/after offsets. ABI 16 adds a typed transition request and integer/null
result. Rust evaluates both states from one set of events. January 1 keeps its
separate rule-year windows; the first second after explicit history keeps its
join check. Core stays no_std; no cache, dependency or timezone-data change.

`zoned-profile-results.json` retains the sampled attribution. Short diagnostic
trials in `zoned-experiments.json` reduce transition time to 2.20 microseconds
with typed transport, then 1.83 with paired checks. The full isolated checkpoint
in `zoned-hillclimb-results.json` records 1.515 microseconds versus the preceding
4.535; TS is 0.459. Eight varying inputs/parity, 20,000 warmup and nine samples of
50,000 calls remain unchanged; transitions retain 1,000 warmup and nine samples
of 5,000. Unchanged pinned reference times come from instant-hillclimb-results.json.

Current medians win 23/48 against TS, 25/48 against temporal-polyfill 1.0.7 and
35/48 against @js-temporal/polyfill 0.5.1. Close workloads vary between checkpoints;
this count is not a stability claim. Transitions and many other operations still
lose to TS; the all-workload goal stays open. Zoned parsing remains 27.26 versus
TS 3.98 microseconds and is the next large boundary-work target.

`zoned-startup-results.json` records nine fresh processes/profile. Native Node
namespace payload is 506,032 bytes gzip, +5,451 versus the Instant checkpoint;
473,022 bytes are WASM. TS is 39,692; local name changes account for two bytes,
and its executable AST still matches baseline. Native ISO/timezone readiness is
16.61 ms versus TS 19.27 ms; full native calendars 27.29 ms. Browser export-all
size is separate. Native owns calendar/timezone data; default TS uses host Intl.
No new conformance exclusions.

All 12 focused Rust/WASM Test262/ICU/Hermes/type targets pass for ABI 16;
validation targets are recorded in zoned-experiments.json. Broader conformance
remains a CI gate. No new exclusions.

### Typed zoned parsing

ABI 17 specializes zoned parsing and resolution, bringing typed routes to 29.
Rust parsing returns the local nanoseconds and valid timezone identifier spelling;
JS retains calendar/zone validation and option getter order. Resolution builds
its complete snapshot from the existing Rust ZonedDateTime instead of dynamic
records and another reconstruction. Compact ISO transport includes all date,
clock, exact offset and day-length fields. Non-ISO/deferred-error results retain
the general complete snapshot. SDK JSON stays unchanged.

`zoned-parse-experiments.json` retains the four incremental trials: typed resolution,
compact snapshots, typed parsing and successful identity metadata. Shared-process
parse medians were 22.78, 21.28, 12.47 and 10.12 microseconds. The last trial also
slowed its TS controls; use the isolated checkpoint for throughput claims.

`zoned-parse-hillclimb-results.json` refreshes all 48 TS/WASM workloads in separate
processes, eight varying inputs/parity, 20,000 warmup and nine samples of 50,000
calls. Transitions retain 1,000 warmup and nine samples of 5,000. Pinned reference
results are explicitly retained from the preceding checkpoint.

| Workload        | Previous WASM µs | Current WASM µs | Current TS µs |
| --------------- | ---------------: | --------------: | ------------: |
| zonedParse      |           27.256 |           9.907 |         3.969 |
| zonedRound      |           12.929 |          13.535 |         2.812 |
| zonedWith       |           20.961 |          21.515 |         9.359 |
| zonedTransition |            1.515 |           1.512 |         0.446 |

Zoned parsing improves 64%, while TS parsing stays near 3.98 microseconds. WASM
still loses that workload by 2.50x. Current medians win 24/48 versus TS, 25/48
versus temporal-polyfill 1.0.7 and 35/48 versus @js-temporal/polyfill 0.5.1. This
is not stable-win proof: timeRoundFormat loses this checkpoint, and earlier
longer Instant rounding controls disagreed with its apparent win. All 24 slower
workloads and their ratios are listed in zoned-parse-experiments.json. Goal open.

The parse benchmark reads only epochNanoseconds. TS stores three slots, computes
calendar/day-length fields lazily and benefits from warmed host Intl offset
caches. WASM still returns complete Rust fields eagerly. Both run the unchanged
public workload; the result-demand difference remains part of the cost.

`zoned-parse-profile-results.json` records a fresh named-WASM CPU profile after
these changes. Rust is 65.13% of weighted self samples; recurring-rule event
construction and historical-offset visitation are 11.66% and 11.63% respectively.
JS facade self samples are 21.46%, GC 4.34%; setup/runtime helpers remain explicit.
These profiles guide the next iteration, not production throughput claims.

`zoned-parse-startup-results.json` records nine fresh processes/profile. Native
Node namespace payload is 509,609 bytes gzip (+3,577): JS 33,607 and WASM 476,002.
TS is 39,692 with host Intl; native retains owned calendar/timezone data. Native
ISO/timezone readiness is 17.01 ms versus TS 19.39 ms; full calendars 27.74 ms.
Browser export-all consumers are separate: native 512,665 bytes gzip, TS 39,749.
The pure TS executable AST still matches the baseline after lexical renaming;
the intrinsic-capture negative control remains rejected.

All 12 focused Rust/WASM Test262/ICU/Hermes/type targets pass. New controls cover
signed bounds, fields, optional/exact offsets, alias spellings, malformed request
recovery, complete ISO/Gregorian getters, poisoned Array iteration and option
getter order. No new exclusions, operation-result cache or dependency.

### Bounded timezone resolution

The preceding profile attributed about 12% of zoned-parse self time to repeated
historical-offset scans and another 12% to recurring-rule events. Rust now exposes
`TimeZone::visit_offsets_at(local, visitor)` with a full-history default for custom
providers. TransitionZone validates offsets strictly inside one day, so every valid
candidate instant or transition producing a containing gap/fold is within local
plus/minus one day. Two binary searches select that history window and its entering
offset; footer standard/daylight offsets remain included when relevant. Named and
resolved providers forward the optional method. Full-history visitation is unchanged.
No data, cache or dependency is added.

Monthly recurring events use Gregorian month length instead of converting the
next month. Jan 1 conversion remains only for Day/Julian rules. Future offset
queries extract the year from signed floor-divided seconds, which fit i64 for
every valid Instant; adjacent-year windows and event/tie order stay unchanged.
Complete Rust results, ABI 17 and all 29 typed routes remain intact.

`bounded-zone-experiments.json` records three incremental shared-process trials.
Parse medians were 7.70 microseconds after bounded lookup, 7.26 after simpler
monthly events and 7.16 after direct year extraction. TS controls stayed near
3.90–3.99 microseconds. Small incremental changes are not stable-win evidence;
production claims use the separate isolated checkpoint.

All 63 focused Rust/TS/WASM/Test262/ICU/Hermes targets pass. A public-resolution
matrix compares bounded lookup against a provider using the full-history default,
including dense transitions, more offsets than the stack deduplication buffer,
near-day offsets, gaps/folds, footer joins, signed nanoseconds and timestamp bounds.
Literal February last-weekday controls distinguish common/leap years. Validated
Rust sources still match after formatting. No TS source changes or new exclusions.

`bounded-zone-hillclimb-results.json` refreshes all 48 TS/native-data WASM workloads
in fresh sequential processes, with the unchanged eight inputs/parity and 20,000
warmup plus nine samples of 50,000 calls. Transitions retain 1,000 warmup and nine
samples of 5,000. Pinned reference results are explicitly retained from the prior
checkpoint. TS and native JS consumer hashes match that checkpoint byte-for-byte.

| Workload        | Previous WASM µs | Current WASM µs | Current TS µs |
| --------------- | ---------------: | --------------: | ------------: |
| zonedParse      |            9.907 |           7.235 |         3.905 |
| zonedRound      |           13.535 |          11.415 |         2.860 |
| zonedWith       |           21.515 |          19.352 |         9.508 |
| zonedAddDay     |           17.915 |          15.134 |         6.364 |
| zonedDayStart   |           12.949 |          10.416 |         2.108 |
| zonedTransition |            1.512 |           1.377 |         0.490 |

Parsing improves 27% this phase; TS still wins by 1.85x. Current medians win 23/48
against TS, 25/48 against temporal-polyfill and 36/48 against @js-temporal/polyfill.
All 25 slower workloads/ratios are explicit in bounded-zone-experiments.json.
Instant.round loses the full checkpoint (0.625 versus TS 0.599 microseconds) and
its longer control (0.653 versus 0.601). The latter retains eight varying inputs,
100,000 warmup and nine samples of 500,000 calls in separate processes; see
bounded-zone-round-controls.json. Close wins remain unstable. Goal stays open.

Fresh separate parse/round CPU profiles are in bounded-zone-profile-results.json.
Parse Rust self samples fall to 54.34% of the profile; rule events are 7.93%, local
offset visitation 2.52%. Self sample categories are not independently timed layers.
Zoned rounding still spends 12.18% in generic JS decoding and 4.96% writing, with
Rust dynamic record reading/indexing also visible. Typed zoned result transport
remains a next target. Profile timings/sizes are not production claims.

Nine-process startup in bounded-zone-startup-results.json measures native
ISO/timezone readiness at 16.96 ms versus TS 19.48 ms; full native calendars
27.65 ms. Native Node namespace is 507,887 gzip bytes: JS 33,607 plus WASM 474,280,
down 1,722 gzip bytes from the previous checkpoint. Raw WASM grows 318 bytes;
no timezone/calendar data was added. TS namespace stays 39,692 gzip bytes.
Browser export-all consumers are separate: native 510,943 bytes gzip, TS 39,749.
TS and native bindings remain byte-identical to the prior checkpoint; the default
TS AST also matches the independent baseline and rejects the negative control.

### Typed zoned operations

ABI 18 adds direct zoned addition/subtraction, rounding and day-start requests:
32 typed routes among the unchanged 69 normalized operations. They call the public
Rust methods and encode complete results from the existing typed value, avoiding
dynamic request maps and a second zoned reconstruction. ISO records are built on
the stack with all calendar/week/clock fields, exact offset text/nanoseconds and
day length. Non-ISO/deferred-error snapshots retain their complete general path.
SDK JSON shapes and data dependencies stay unchanged.

Private local resolution accepts already validated nanoseconds. Public field
constructors retain field/range validation; day boundaries keep the identical
local range check. DateTime constructors that discard full ISO conversion now use
its range check directly, keeping calendar validation. Offset-hint matching uses
the bounded visitor, preserving the full-history default for custom providers.
Native-only construction wraps private/Rust-result slots with the standard
prototype; numeric user constructors keep validation. Pure TS must retain its
baseline executable AST.

`zoned-operations-experiments.json` records seven diagnostic stages and three
alternating controls. Isolated nanoseconds/fields/fields/nanoseconds controls favor
direct resolution for parse/round/day start; DateTime parse varies and does not
prove a per-variant gain. Checked/trusted/trusted/checked construction shows modest
parse/add/round gains, mixed day-start changes. These are not universal stable-win
claims. Copied lazy snapshots, a separate flat JS decoder and Rust prevalidation
before options are discarded. Prevalidation added a boundary without consistent
gain and slowed DateTime addition. All Rust/JS result fields remain eager.

All 66 focused Rust/TS/WASM/Test262/ICU/Hermes targets pass, including Rust public
calendar/context/registry controls. New tests cover typed packet bounds/recovery,
all nine rounding modes, optional day zero, wide Number duration fields, bounded
versus full-history offset-hint policies, every public ISO field at week/year/BCE/
range boundaries, ownership across memory growth, getter reuse, correct prototypes,
constructor range rejection and poisoned Array iteration. Final formatted sources
match their recorded SHA-256 hashes. No new conformance exclusions.

`zoned-operations-hillclimb-results.json` refreshes all 48 TS/native-data WASM
workloads in fresh sequential processes, unchanged eight inputs/parity, 20,000
warmup and nine samples of 50,000 calls. Transitions retain 1,000 warmup and nine
samples of 5,000. Pinned reference times are explicitly retained from the preceding
checkpoint. Default TS executable AST matches the independent baseline; its
intrinsic-capture negative control remains rejected.

| Workload      | Previous WASM µs | Current WASM µs | Current TS µs |
| ------------- | ---------------: | --------------: | ------------: |
| zonedRound    |           11.415 |           3.870 |         2.869 |
| zonedAddDay   |           15.134 |           5.834 |         6.243 |
| zonedDayStart |           10.416 |           3.818 |         2.075 |
| zonedParse    |            7.235 |           6.339 |         3.999 |
| zonedWith     |           19.352 |          18.641 |         9.538 |
| dateTimeParse |            2.762 |           2.901 |         2.470 |

Rounding latency falls 66%, addition 61%, day start 63%. Addition wins this
checkpoint; rounding/day start/parsing still lose to TS. DateTime parsing is
slower than its preceding measurement despite the simpler constructor check;
short diagnostics did not establish a stable gain. Current medians win 24/48
against TS, 25/48 against temporal-polyfill and 36/48 against @js-temporal/polyfill.
All 24 slower cases/ratios are recorded in zoned-operations-experiments.json.
Instant rounding remains slower here (0.570 versus TS 0.453 microseconds); prior
longer controls also lost. Median counts are not stable-win proof. Goal open.

`zoned-operations-profile-results.json` records fresh separate profiles for zoned
rounding, YearMonth formatting and Duration parsing. Rounding now spends 12.40%
self time in zonedResult, 5.94% in dateTimeResult and 10.20% in recurring-rule
events. YearMonth formatting still shows request encoding and Rust formatter/
writer costs. Duration parsing spends 29.08% self time in createDuration, 9.86%
in generic decode and 4.83% in decodeResult; the Rust parser function itself is
1.57%. Rust overall is 28.38%, JS facade 60.16%. Typed duration records and
private construction from validated Rust results are the next candidates.
Profiles include explicit setup/warmup/runtime helpers/GC; their timings and
sizes are not production claims.

Nine fresh processes/profile in zoned-operations-startup-results.json measure
native ISO/timezone readiness at 16.70 ms versus TS 19.40 ms; full native calendars
27.42 ms. Native Node namespace is 513,202 gzip bytes (+5,315): JS 33,896 and WASM
479,306. Raw WASM grows 7,064 bytes; no calendar/timezone data is added. TS namespace
is 39,691 bytes gzip, one byte below the prior name-only variant; executable AST
is unchanged. Browser export-all consumers are separate: native 516,265 bytes gzip,
TS 39,748. No new dependency, cache or conformance exclusion.

## Typed Duration operations

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
