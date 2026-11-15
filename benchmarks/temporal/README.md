# Temporal kernel experiment

TS timezone/ISO primitives look worth pursuing. Full Temporal size, speed and
compliance remain unproven. This directory is experimental, unpublished code.

## Run

```sh
bazel test -c opt //packages/intl-datetimeformat:timezone_icu_test //benchmarks/temporal:kernel_test
bazel run -c opt //benchmarks/temporal:benchmark
```

The benchmark prints JSON; `results.json` records one Linux x64 run on pinned
Node 24.14.0/V8 13.6. The reference imports `temporal-polyfill/implementation`
1.0.7, forcing JS even if native Temporal exists. Both run with host ICU 78.2,
tzdb 2025c; the kernel embeds pinned IANA 2026f. Selected benchmark zone rules
agree. Results do not compare identical data policies or API coverage.

## What runs

`kernel.ts` reuses `ecma262-abstract/DateOperations` and
`ecma402-abstract/DateTimeFormat/TimeZoneOffset`. It adds exact nanosecond/ISO
conversion, ISO day addition, possible instants and earlier/later/compatible/reject
disambiguation. `zones.ts` decodes only the requested canonical zone through the
existing datetimeformat unpacker. No host Intl timezone lookup.

Experimental `instant.ts` adds an Instant slice; durations, rounding, aliases
and transition queries remain unimplemented. `calendar.ts` separately supplies numeric
ISO/Hebrew arithmetic. Other optional TS calendars still use temporal-polyfill;
they cannot yet serve as an independent replacement.
The gap resolver assumes IANA gaps are isolated within its two-day window.
That assumption is tested here, not a general-purpose transition-index contract.
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
bazel test -c opt //benchmarks/temporal:calendar_test
```

ICU fixtures cover over 6,000 dates in epoch days -1,000,000 through +1,000,000
plus denser 1900–2100 coverage. Both conversion directions match. An initial
full-range ICU4J 79.1 oracle stalled in `CalendarCache.findIndex` on extreme
negative dates; that unreliable range is excluded from the ICU control, not
claimed as validated by it. Separate forced-polyfill checks cover both full
Temporal date boundaries, leap-month/year arithmetic and signed durations.
The earlier size/runtime records below predate this separate calendar module.

## Instant facade and Test262 slice

`instant.ts` adds the Instant constructor, numeric factories, private branding,
read-only epoch getters, `valueOf`, and limited `from`/`equals`. Constructor input
coercion precedes observable `newTarget.prototype` access; a construct trap avoids
JS's normal allocation-before-body order. Static factories ignore subclass
receivers. WeakMap slots stay off instances and reject proxies/forged receivers.

String support is an explicit RFC 3339-style subset: extended years, nanoseconds,
UTC/numeric offsets and leap-second normalization. Basic ISO forms, RFC 9557
annotations, ZonedDateTime input and full serialization remain unsupported.
Cross-realm slot sharing and foreign-realm default-prototype fallback remain open.
This slice is not installed globally outside the test prelude.

```sh
bazel test -c opt //benchmarks/temporal:instant_test //benchmarks/temporal:instant_test262
bazel run -c opt //benchmarks/temporal:facade_benchmark
# Diagnostic: expected to fail until the remaining Instant API exists.
bazel test -c opt //benchmarks/temporal:instant_test262_full
```

The strict slice executes all constructor/prototype-root tests and complete
numeric-factory, epoch-getter, valueOf and toStringTag directories from the pinned
Test262 checkout: **94/94 executions pass**. No individual-file exclusions or
expected-failure baseline. The prelude replaces the entire native Temporal
namespace in every realm, including recursively created realms.

The full Instant corpus is a separate manual raw diagnostic: **934 executions,
202 passes, 732 failures**. Missing arithmetic, rounding, serialization and parser
forms dominate. Negative cases can pass incidentally when methods/types are
missing; these aggregate passes do not establish whole-method conformance.
`conformance-results.json` records counts and failure areas. Raw failures remain
in Bazel test output; the full diagnostic does not turn them into a green gate.

`facade-results.json` measures the supported object paths against forced
`temporal-polyfill` 1.0.7 classes, seven alternating batches of 50,000 after 5,000
warmups. One shared-host V8 run, median ns/operation:

| Operation                                    | Facade | Reference |
| -------------------------------------------- | -----: | --------: |
| Construct, read epochNanoseconds             |    375 |       293 |
| fromEpochNanoseconds, read epochMilliseconds |    408 |       466 |
| fromEpochMilliseconds, read epochNanoseconds |    305 |       341 |

Constructor is slower; factories modestly faster in this run. The numeric
kernel's earlier advantage does not translate into an established object-API
win. Profile matched full behavior before choosing a runtime architecture.
Minified gzip: Instant slice **2,085 bytes**, independent ISO/Hebrew arithmetic
**1,822 bytes**. These are separate bundles, exclude timezone data, and implement
far less API than the 19,393-byte reference. Sizes are not additive or a full
Temporal size estimate.

## Measured footprint

Minified gzip, esbuild ES2022, gzip level 9:

| Artifact                                                        |  Bytes |
| --------------------------------------------------------------- | -----: |
| Numeric kernel, data supplied by caller                         |  1,901 |
| Kernel plus all owned timezone data                             | 64,074 |
| temporal-polyfill basic implementation, host Intl timezone data | 19,393 |

These implement different APIs. Kernel size excludes the missing Temporal API
and non-ISO calendars. Code-only size is not measured incremental npm size:
sharing data/source across separately bundled published packages needs a packaging
plan and its own measurement. Data dominates the standalone owned-data variant.
WASM would still need that data plus JS object semantics/glue; no WASM size was
measured.

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
No browser/Hermes measurement yet.

## Next decision

Continue TS by connecting the ISO/Hebrew kernel to a PlainDate facade, completing
instant parsing/serialization and replacing the gap-window assumption with a
transition index. Expand strict Test262 coverage as each complete surface lands.
Then compare equivalent standalone/shared-data packages on V8 and Hermes/browser
engines. Consider WASM after an equivalent core demonstrates a concrete benefit.

References: [ICU BasicTimeZone](https://unicode-org.github.io/icu-docs/apidoc/dev/icu4j/com/ibm/icu/util/BasicTimeZone.html),
[Temporal timezone semantics](https://tc39.es/proposal-temporal/docs/timezone.html).
