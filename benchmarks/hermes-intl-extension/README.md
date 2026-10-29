# Hermes Intl extension benchmark

Build Hermes with the [FormatJS contrib package](../../native/hermes/package/contrib/README.md),
then build and run the benchmark bundle:

```sh
bazel build //benchmarks/hermes-intl-extension:suite_bundle
/path/to/hermes bazel-bin/benchmarks/hermes-intl-extension/suite_bundle.js
```

The bundle registers English locale data in the TypeScript constructors. All
12 APIs and two `formatToParts` cases check matching output, then time seven
rounds calibrated to roughly 50 ms each. The `formatToParts` cases include
`JSON.stringify` to compare full output. Native and TypeScript constructors
run with their own Intl dependencies in the same Hermes process. Results are
median time per call.

Pinned Hermes `393a539e6`, Linux x86_64, Intel Xeon Platinum 8488C. Table uses
the median of three complete benchmark invocations. This is the historical
full-API baseline, before the later optimizations below:

| Operation                          | Native µs |   TS µs | TS/native |
| ---------------------------------- | --------: | ------: | --------: |
| `getCanonicalLocales`              |      0.82 |    4.44 |      5.43 |
| `supportedValuesOf`                |      1.81 |   58.59 |     32.43 |
| `Locale.maximize`                  |      3.32 |   33.20 |     10.00 |
| `PluralRules.select`               |      0.54 |  121.88 |    226.91 |
| `ListFormat.format`                |      1.14 |    4.30 |      3.78 |
| `ListFormat.formatToParts`         |      4.64 |    5.86 |      1.28 |
| `DisplayNames.of`                  |      1.54 |    7.71 |      5.02 |
| `Segmenter.segment`                |      6.05 |    8.89 |      1.47 |
| `Collator.compare`                 |      1.61 |    3.17 |      1.97 |
| `NumberFormat.format`              |      2.39 |  343.75 |    143.67 |
| `RelativeTimeFormat.format`        |      1.10 |  400.00 |    364.09 |
| `RelativeTimeFormat.formatToParts` |      3.96 |  400.00 |    101.14 |
| `DateTimeFormat.format`            |      4.10 | 1000.00 |    243.81 |
| `DurationFormat.format`            |      3.86 |  875.00 |    226.84 |

Ratios below 1 mean native is slower. These are one host's steady-state timings,
not startup or package-size results.

`supportedValuesOf` now reuses results while its formatter and locale data stay
unchanged. First call still probes candidates; later calls return fresh arrays.
The earlier 1,675 µs native result was before this cache.
`Locale.maximize` now transforms its Rust record directly. The earlier native
result was 10.9 µs.
`Segmenter.segment` now passes UTF-16 directly and returns segment boundaries
without JSON. The earlier native result was 10.16 µs on the same host.

`overlap.js` runs the APIs shared with
[magrinj/hermes-intl at 7cd12b6](https://github.com/magrinj/hermes-intl/tree/7cd12b68fb6f707192426065cec1dba4ced68d5a) on either Hermes
host. It uses `__now()` when available, otherwise `Date.now()`. Median of three
runs on the same host. Both C++ hosts use Release `-O3`; FormatJS Rust uses
Bazel `-c opt`, magrinj Rust uses its release profile (`opt-level="z"`, LTO):

Both factories and workload now use Hermes `-O` bytecode. The upstream comparator
host evaluates its bootstrap as runtime source, which omits the full optimizer.
The [host patch](magrinj-host.patch) adds a precompiled-bootstrap input. The
[pinned optimized baseline](optimized-baseline-results.json) supersedes earlier
cross-implementation timings; historical FormatJS before/after comparisons remain
useful. Optimizing magrinj preserves its 222 differences in the 2,871-case ICU
list matrix; FormatJS has zero differences against the selected ICU4C outputs.

Three alternating optimized runs on 2026-10-29, including registry snapshots,
default ListFormat construction, array locale lists, reused RTF number records
and direct serialization of validated RTF options.
[Raw results and profiles](relative-options-results.json).

| Operation                            | FormatJS µs | Magrinj µs |
| ------------------------------------ | ----------: | ---------: |
| `getCanonicalLocales`                |        0.78 |       1.11 |
| `Locale.maximize`                    |        0.27 |       2.12 |
| `PluralRules.select`                 |        0.52 |       0.46 |
| `PluralRules.select(decimal)`        |        0.60 |       0.46 |
| `PluralRules.select(string)`         |        0.69 |       0.93 |
| `PluralRules.select(ordinal)`        |        0.55 |       0.46 |
| `PluralRules.select(ru)`             |        0.59 |       0.51 |
| `PluralRules.selectRange`            |        2.20 |       0.90 |
| `ListFormat.format`                  |        1.11 |       0.53 |
| `ListFormat.formatToParts`           |        3.42 |       3.27 |
| `RelativeTimeFormat.format`          |        1.11 |       0.72 |
| `RelativeTimeFormat.formatToParts`   |        3.17 |       2.18 |
| `RelativeTimeFormat.format(decimal)` |        1.46 |       0.79 |
| `RelativeTimeFormat.format(auto)`    |        0.56 |       0.60 |
| `Locale.new`                         |        0.35 |       0.92 |
| `Locale.new(options)`                |        1.83 |       4.87 |
| `Locale.new(zh-HK)`                  |        0.35 |       1.34 |
| `Locale.new.language`                |        0.43 |       1.25 |
| `Locale.new.toString`                |        0.40 |       0.99 |
| `Locale.language`                    |        0.08 |       0.09 |
| `Locale.new(Locale)`                 |        0.32 |       0.95 |
| `Locale.new(diverse)`                |        4.36 |       1.43 |
| `Locale.new(long)`                   |        4.15 |       3.86 |
| `PluralRules.new`                    |        2.93 |       4.42 |
| `PluralRules.new(options)`           |        6.35 |       4.86 |
| `ListFormat.new`                     |        2.23 |       2.75 |
| `ListFormat.new(default)`            |        1.19 |       2.54 |
| `ListFormat.new(array)`              |        2.23 |       2.85 |
| `ListFormat.new(options)`            |        3.60 |       2.69 |
| `ListFormat.new(fallback)`           |        3.17 |       3.49 |
| `ListFormat.new(unsupported)`        |        3.36 |       3.71 |
| `RelativeTimeFormat.new`             |        5.19 |       4.60 |
| `RelativeTimeFormat.new(fallback)`   |        6.23 |       5.39 |

The decimal case formats -1234.5 days; auto formats -1 day as "yesterday".
These parts timings read array length, whereas the full suite serializes parts.
Our ListFormat bridge preserves lone surrogates and reads array getters once;
magrinj's shortcut does neither.

Native registries retain prepared locale matchers rather than hashing all
423 registered IDs per call. After the first nonexact request, a lazy raw-key
index also replaces the linear exact-candidate scan. Registering new IDs
invalidates both; replacing data under existing IDs keeps matching unchanged.
First exact requests retain the cheap existing path. Distances, thresholds,
registration-order ties and winning-request indices stay unchanged.

Three-run medians against `427eb62d` cut ListFormat fallback construction from
18.07 to 4.27 µs (76%), unsupported construction from 14.16 to 4.39 µs (69%),
and RelativeTimeFormat fallback construction from 25.39 to 11.96 µs (53%).
Optimized magrinj remains faster at 3.52, 3.66 and 5.37 µs respectively. Default
ListFormat/RTF constructors and their steady string/parts formats move by
1–3%; all raw cases remain in the results file. Constructor checks include resolved locales outside timing.

The mixed `Locale.new(diverse)` control shifts from 3.94 to 4.61 µs, with
overlapping run ranges. A separate paired control extracts that unchanged case
and harness, running it as source against both optimized factories. Both isolated
medians are 4.18 µs. The shift does not reproduce in isolation; the raw mixed
results remain authoritative and the cause is unproven.

The Rust probe isolates the old shared wrapper at 14.0 µs for `en-XX`, versus
about 0.6 µs through the new registry snapshot. Exact `en` remains around 70 ns.
Bypassing the scan without an index would make that exact path slower, so it is
not used. The 1 kHz constructor profile reduces `listMatch` from 80% to 26% of
self samples. Host frames aggregate C++ and Rust; canonicalization, JSON and
record creation now account for much of the remaining cost.

With constructor options omitted, ListFormat now negotiates locales and creates
its default record in one Rust call. JS still canonicalizes every requested tag;
explicit options retain their separate resolution and getter ordering. The
additive C ABI accepts canonical locale-list JSON and returns an owned handle.

Three alternating runs against `a395be79` reduce string-locale construction from
3.36 to 2.20 µs, omitted locales from 2.32 to 1.16 µs, fallback from 4.33 to
3.14 µs and unsupported requests from 4.46 to 3.17 µs. Optimized magrinj measures
2.66, 2.45, 3.43 and 3.62 µs respectively. Array input improves from 4.27 to
2.99 µs but trails magrinj's 2.74 µs. Explicit empty options remain 3.48 µs
versus 2.54 µs. The default-locale controls resolve to en in FormatJS and en-US
in magrinj; their labels remain different in the raw results.

The constructor profile replaces separate `listMatch` and `listCreate` host
frames with `listCreateDefault`. Canonicalization and the fused call now dominate;
profiles aggregate C++ and Rust rather than attributing all host time to Rust.

Array locale lists now skip the captured Locale intrinsic's brand probe: arrays
cannot carry Locale internal slots. This avoids a caught exception on every
array input, without skipping HasProperty/Get, coercion or trailing validation.
Three alternating runs against `c443d607` reduce `ListFormat.new(array)` from
3.05 to 2.29 µs, versus optimized magrinj's 2.82 µs. String construction stays
at 2.20 µs. Explicit empty options measure 3.60 µs versus 3.48 µs before and
2.58 µs in magrinj; omitted locales measure 1.24 µs versus 1.17 µs before.
All 297 outputs remain recorded, including these controls and default-locale
differences. Other constructor and steady-state gaps remain.

RelativeTimeFormat now shares immutable internal NumberFormat records within each
locale pack. Keys include resolved locale and numbering system; at most 64 short
keys are retained. Style/numeric getters and validation still run; replacement
packs have independent caches, public receivers stay distinct and formatting
takes no cache lock. Three alternating runs against `aac63208` reduce construction
from 11.35 to 6.35 µs and fallback construction from 12.21 to 7.32 µs. Optimized
magrinj remains faster at 4.53 and 5.37 µs. All steady-state controls remain in
the raw results.

The Rust probe cuts warm `create_resolved` from 3,414 to 90 ns; resolution stays
near 0.9 µs. The same 50,000-constructor profile drops `relativeCreate` from
216 of 454 samples to 37 of 238. Host frames include C++ and Rust. Resolution,
JS constructor work and JSON serialization now dominate the remaining cost.

[ICU4X relative-time checks](../../conformance-tests/icu4x/README.md) cover 19,008
outputs. All 1,440 pinned separator differences are independently verified with
ICU4C/J 78.1, using ECMA-402 grouping defaults. Outputs are compared directly.

The RTF facade now serializes its validated enum/ASCII options directly. Removing
the generic record serializer, temporary value record and key arrays cuts string
construction from 6.23 to 5.19 µs and fallback construction from 7.20 to 6.23 µs
in three alternating runs against `1a778f12`. Optimized magrinj measures 4.60 and
5.39 µs. Locale resolution still precedes style/numeric getters; malformed
numbering-system strings reject before later getters. General locale and query
text still use string quoting.

In paired 50,000-constructor profiles, JSON serialization drops from 29 of 233
samples to 9 of 196. Native resolution, canonicalization and final creation now
account for most host work. This remains a C++/Rust aggregate profile. All 297
outputs and every steady-state control remain in the raw results.

The [regional fixtures](../../conformance-tests/icu4j/locale-format-fixtures.tsv)
pin Chinese output against ICU4J 78.1. At the magrinj revision above, `zh-TW`
formats weeks as `3周前` instead of `3 週前`; `zh-Hant-HK` produces `3 週前`
instead of Hong Kong's `3 星期前`. The timing table uses English requests.

Shared RTF rounding, direct string assembly, and stack unit decoding reduced
`format` from 1.39 to 1.05 µs, decimal formatting from 1.99 to 1.50 µs, and
`formatToParts` from 3.36 to 3.09 µs in alternating before/after runs.
An earlier Rust stage profile put 1.51 µs in NumberFormat and 0.34 µs in plural
selection. NumberFormat pattern and exponent optimizations reduced that cost;
RTF now selects its own locale rules from the number formatter's rounded value.

Returning an exact first locale before building the fallback matcher index cut
`ListFormat.new` from 18.3 to 3.30 µs, `PluralRules.new` from 10.7 to 7.45 µs,
and `RelativeTimeFormat.new` from 28.8 to 13.2 µs in alternating runs. Fallback
matching still uses the same CLDR distance algorithm and request ordering.
Keep its request collection separate: chaining the already-inspected first
request back into the iterator regressed nonexact matching by 17–18% in optimized
builds. The separate collection preserves baseline fallback timings.

Fallback requests `en-XX`; unsupported requests `qzz`. FormatJS resolves them
to `en` in both cases; magrinj resolves them to `en` and `en-US`.
These cases compare constructor cost with different matching results. Their
timings exclude reading `resolvedOptions().locale`.

Direct serialization of typed Rust properties removes the intermediate JSON
tree. Constructor canonicalization repeats only after options change a language
ID or Unicode keywords. In three alternating optimized host runs against
`989821174`, `Locale.new` fell from 6.96 to 4.52 µs (35%), the region-option
case from 8.30 to 6.10 µs (26%), `zh-HK` from 7.69 to 5.13 µs (33%), and
`Locale.maximize` from 5.80 to 3.85 µs (34%). JS option getter order stays intact.
[Raw samples and build settings](locale-perf-results.json) include all overlap
operations and the magrinj comparison. An isolated Rust stage probe measured
constructor cost at 1.03 µs before and 0.34 µs after; properties JSON cost fell
from 1.38 to 0.35 µs.

Locale now retains its immutable scalar snapshot on first access. With no
options, Rust handles validation and canonicalization in one call. Explicit
options retain their observable getter order. Against `08db5df5e`, three
alternating optimized runs cut default construction from 4.58 to 1.68 µs (63%),
region options from 5.98 to 4.09 µs (32%), and `zh-HK` from 5.07 to 2.17 µs (57%).
Construction plus first `language` access falls from 4.76 to 3.72 µs (22%);
first `toString` from 4.76 to 3.66 µs (23%). This includes the deferred work.
Warm `language` reads increase from 95 to 103 ns; maximize stays near 4 µs.
Default construction remains slower than optimized magrinj's 0.91 µs; the region
option case beats its 4.88 µs. [Raw runs](locale-snapshot-results.json) include the
isolated lazy-only step, first-read checks, warm getters and Locale copies.

Before this change, a 1 kHz Hermes constructor profile attributes 43% of samples
to the scalar query and `JSON.parse`. Reproduce with
`locale-constructor-profile.js` and the profiling command below. The optimization
retains eager validation and per-call formatter capability queries.

Locale now shares private immutable backend records across repeated constructors
and transforms, retaining fresh public receivers. Rust keeps each extension's
canonical payload in one string. In three optimized 29-case runs against
`144d5440d`, caching cuts default construction from 1.86 to 0.43 µs, region
options from 4.15 to 1.86 µs, and maximize from 4.03 to 0.34 µs.

A separate three-run paired trial binds private WeakMap methods, removing
Reflect.apply argument arrays. Default construction falls again to 0.35 µs,
maximize to 0.26 µs, and construction plus first `language` access to 0.43 µs
(originally 3.97). Warm getters fall from 0.11 to 0.077 µs. Optimized magrinj
measures 0.93, 2.12, 1.25 and 0.086 µs respectively.

Cold/diverse construction initially regresses from 3.97 to 4.52 µs; binding
removes that regression, reaching 3.78 µs. The control cycles 192 distinct valid
tags, exceeding cache capacity; magrinj remains faster at 1.44 µs. A long
private-use tag bypasses caching: 9.52 µs originally, 5.37 with caching/payload
changes, then 6.23 with binding. The final result improves 35% over baseline,
still behind magrinj's 3.87 µs. [All raw runs and profiles](locale-model-results.json)
retain each phase separately, including a rejected first-use admission trial.

The constructor profile observes one model before its loop, matching benchmark
setup. Host creation falls from 70% to one of 329 self samples (0.3%). Reflect.apply
accounts for 17% after caching and none after binding. Remaining samples concentrate in JS allocation and WeakMap
operations. Host samples aggregate C++ and Rust.

The [three-oracle list matrix](../../conformance-tests/icu4c/README.md) exposed
108 output differences against the selected ICU4C behavior in the previous
FormatJS build; contextual Spanish/Hebrew joins reduce that count to zero over
2,871 inputs. Magrinj has 222 differences in the same matrix, including lone
surrogate replacement. Eighteen ICU4J differences and 66 ICU4X differences are
recorded separately; the latter API cannot represent 99 lone-surrogate cases.
Three alternating English runs show no measurable timing change: formatting
1.10 µs, parts 4.52 µs. [Raw results](list-context-results.json).

ListFormat parts now use ordinary `{type, value}` records. Private null-prototype
append descriptors are reused within each call; inherited `get`/`set` cannot
interfere with input or output arrays. Three alternating optimized runs cut
parts from 4.64 to 3.11 µs. That historical run used magrinj's runtime-source
bootstrap (4.34 µs); optimized comparisons appear above. Formatting
fell from 1.13 to 1.04 µs. Fresh records, descriptors, property order, poisoned
prototypes and all ICU outputs stay checked. [Raw samples](list-parts-results.json).

Reproduce the optimized comparison with the pinned magrinj checkout and clean
Hermes `393a539e6` source/build. Build Hermes in Release with contrib extensions
off and magrinj's Rust archive with its upstream shipping release profile first.
The Linux host links those existing artifacts:

```sh
set -e
formatjs_src="$PWD"
magrinj_src=/path/to/magrinj-hermes-intl
hermes_src=/path/to/hermes
hermes_build=/path/to/hermes-build
magrinj_rust=/path/to/release/libhermes_intl.a
git -C "$magrinj_src" apply "$formatjs_src/benchmarks/hermes-intl-extension/magrinj-host.patch"
c++ -std=c++20 -O3 -DNDEBUG \
  "-DHERMES_INTL_BOOTSTRAP=\"$magrinj_src/js/bootstrap.js\"" \
  -I"$magrinj_src/cpp" -I"$hermes_src/API" -I"$hermes_src/API/jsi" -I"$hermes_src/public" \
  "$magrinj_src/host/main.cpp" "$magrinj_src/cpp/hermes_intl.cpp" \
  "$magrinj_rust" "$hermes_build/lib/libhermesvm_a.a" \
  "$hermes_build/external/boost/boost_1_86_0/libs/context/libboost_context.a" \
  "$hermes_build/jsi/libjsi.a" -lpthread -ldl -lm -o /tmp/hi-host-optimized
bazel build -c opt //benchmarks/hermes-intl-extension:overlap_bytecode //benchmarks/hermes-intl-extension:magrinj_bootstrap_bytecode
workload=$(bazel cquery -c opt //benchmarks/hermes-intl-extension:overlap_bytecode --output=files)
bootstrap=$(bazel cquery -c opt //benchmarks/hermes-intl-extension:magrinj_bootstrap_bytecode --output=files | rg '\.hbc$')
/path/to/formatjs-hermes "$workload"
FORMATJS_BENCH_BOOTSTRAP="$formatjs_src/$bootstrap" /tmp/hi-host-optimized "$workload"
```

The bootstrap target emits its upstream MIT notice alongside bytecode. Run the
same workload on alternating hosts; keep builds and profiling outside timing runs.

PluralRules binds its private WeakMap getter once, avoids the temporary
mathematical-value record for Number inputs, delegates omitted options to Rust,
and serializes explicit private options in one captured JSON call. Its null
prototype preserves inherited `toJSON` protection.

Across complete optimized runs, selection fell from 0.61 to 0.50 µs, default
construction from 7.57 to 2.87 µs and explicit options from 8.18 to 6.23 µs.
Optimized magrinj measured 0.45, 4.39 and 4.77 µs respectively. FormatJS wins
on default construction and string selection; numeric/decimal/ordinal/Russian
selection, ranges and explicit-options construction remain slower.

[Raw runs, isolated trials and profiles](plural-perf-results.json) include three
complete optimized comparisons and three complete native/TS runs, with all 14
output comparisons intact. The numeric-selection profile removes `mathematical`
and `Reflect.apply`, previously 10.7% and 5.6% of self samples. Before default
constructor changes, JSON stringification accounted for 16%. Range profiling
still puts 64% in the host query and 8% in JSON stringification. Host samples
aggregate C++ and Rust; historical runtime-source comparator runs are labeled.

Reproduce profiles with the same optimized FormatJS host:

```sh
hermes -sample-profiling=chrome -sample-profiling-freq=1000 -profiling-out=select.json benchmarks/hermes-intl-extension/plural-select-profile.js
hermes -sample-profiling=chrome -sample-profiling-freq=1000 -profiling-out=constructor.json benchmarks/hermes-intl-extension/plural-constructor-profile.js
hermes -sample-profiling=chrome -sample-profiling-freq=1000 -profiling-out=range.json benchmarks/hermes-intl-extension/plural-range-profile.js
```
