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
the median of three complete benchmark invocations:

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

| Operation                            | FormatJS µs | Magrinj µs |
| ------------------------------------ | ----------: | ---------: |
| `getCanonicalLocales`                |        0.78 |       1.11 |
| `Locale.maximize`                    |        4.03 |       2.10 |
| `PluralRules.select`                 |        0.51 |       0.45 |
| `PluralRules.select(decimal)`        |        0.58 |       0.46 |
| `PluralRules.select(string)`         |        0.68 |       0.91 |
| `PluralRules.select(ordinal)`        |        0.54 |       0.46 |
| `PluralRules.select(ru)`             |        0.55 |       0.50 |
| `PluralRules.selectRange`            |        2.04 |       0.90 |
| `ListFormat.format`                  |        1.04 |       0.53 |
| `ListFormat.formatToParts`           |        3.17 |       3.23 |
| `RelativeTimeFormat.format`          |        1.05 |       0.72 |
| `RelativeTimeFormat.formatToParts`   |        3.11 |       2.17 |
| `RelativeTimeFormat.format(decimal)` |        1.43 |       0.79 |
| `RelativeTimeFormat.format(auto)`    |        0.52 |       0.61 |
| `Locale.new`                         |        1.68 |       0.91 |
| `Locale.new(options)`                |        4.09 |       4.88 |
| `Locale.new(zh-HK)`                  |        2.17 |       1.33 |
| `Locale.new.language`                |        3.72 |       1.24 |
| `Locale.new.toString`                |        3.66 |       0.98 |
| `Locale.language`                    |        0.10 |       0.08 |
| `Locale.new(Locale)`                 |        1.80 |       0.95 |
| `PluralRules.new`                    |        2.84 |       4.27 |
| `PluralRules.new(options)`           |        6.23 |       4.76 |
| `ListFormat.new`                     |        3.42 |       2.68 |
| `ListFormat.new(fallback)`           |       16.85 |       3.51 |
| `ListFormat.new(unsupported)`        |       12.70 |       3.75 |
| `RelativeTimeFormat.new`             |       11.35 |       4.72 |

The decimal case formats -1234.5 days; auto formats -1 day as "yesterday".
These parts timings read array length, whereas the full suite serializes parts.
Our ListFormat bridge preserves lone surrogates and reads array getters once;
magrinj's shortcut does neither.

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
