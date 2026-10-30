# Hermes Intl extension benchmark

Performance changes must preserve ECMA-402/Test262 behavior and cross-check
pinned ICU4C, ICU4J and ICU4X where their APIs overlap. Record exact data-version
differences; never normalize outputs to hide disagreements.

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

Pinned Hermes `393a539e6`, Linux x86_64, Intel Xeon Platinum 8488C. Current
full-API results use three CPU-0-pinned invocations on 2026-10-30,
including SDK ThinLTO, exact-decimal bypass, ListFormat output sizing, short positional arguments, inline Locale subtags, PluralRules record reuse, Rust-authorized list joins and earlier improvements. Both native and TS code use
optimized Hermes bytecode and high-resolution `__now()` timing.
[Paired SDK results and profiles](collator-direct-results.json).
Both hosts use identical updated TS bytecode, including Segmenter conformance fixes.

| Operation                          | Native µs |   TS µs | TS/native |
| ---------------------------------- | --------: | ------: | --------: |
| `getCanonicalLocales`              |      0.10 |    4.69 |     47.35 |
| `supportedValuesOf`                |      1.93 |   61.45 |     31.79 |
| `Locale.maximize`                  |      0.30 |   36.33 |    120.82 |
| `PluralRules.select`               |      0.34 |  131.46 |    385.61 |
| `ListFormat.format`                |      0.52 |    4.73 |      9.10 |
| `ListFormat.formatToParts`         |      4.30 |    6.38 |      1.48 |
| `DisplayNames.of`                  |      1.37 |    8.25 |      6.02 |
| `Segmenter.segment`                |      4.11 |    8.93 |      2.17 |
| `Collator.compare`                 |      0.86 |    3.41 |      3.99 |
| `NumberFormat.format`              |      2.00 |  364.75 |    181.94 |
| `RelativeTimeFormat.format`        |      0.73 |  425.84 |    582.49 |
| `RelativeTimeFormat.formatToParts` |      2.43 |  426.86 |    175.70 |
| `DateTimeFormat.format`            |      3.89 | 1054.26 |    270.81 |
| `DurationFormat.format`            |      3.78 |  942.16 |    249.04 |

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
useful.

The native benchmark console now uses [native-clock.patch](native-clock.patch)
to expose monotonic `steady_clock` milliseconds through `__now()`, matching the
comparator's clock contract. Rebuild both native variants with that patch.
Historical native hosts used the `Date.now()` fallback; assess small changes
within paired runs using the same clock. Clock resolution checks are retained.
Optimizing magrinj preserves its 222 differences in the 2,871-case ICU
list matrix; FormatJS has zero differences against the selected ICU4C outputs.

Three alternating optimized runs on 2026-10-30, pinned to CPU 0 on every host,
including SDK ThinLTO, exact-decimal bypass, ListFormat output sizing, short positional arguments, inline Locale subtags, PluralRules record reuse, Rust-authorized list joins and earlier improvements. All hosts use high-resolution
`__now()`. FormatJS Rust uses `opt-level=3` plus ThinLTO; magrinj retains its
upstream size-optimized release profile with full LTO and one codegen unit.
[Raw results, controls and profiles](alias-independent-results.json).

| Operation                            | FormatJS µs | Magrinj µs |
| ------------------------------------ | ----------: | ---------: |
| `getCanonicalLocales`                |        0.07 |       1.10 |
| `Locale.maximize`                    |        0.26 |       2.09 |
| `PluralRules.select`                 |        0.29 |       0.45 |
| `PluralRules.select(decimal)`        |        0.33 |       0.45 |
| `PluralRules.select(string)`         |        0.43 |       0.91 |
| `PluralRules.select(ordinal)`        |        0.31 |       0.46 |
| `PluralRules.select(ru)`             |        0.33 |       0.50 |
| `PluralRules.selectRange`            |        0.65 |       0.88 |
| `ListFormat.format`                  |        0.42 |       0.53 |
| `ListFormat.formatToParts`           |        2.82 |       3.22 |
| `RelativeTimeFormat.format`          |        0.67 |       0.71 |
| `RelativeTimeFormat.formatToParts`   |        1.55 |       2.16 |
| `RelativeTimeFormat.format(decimal)` |        0.77 |       0.78 |
| `RelativeTimeFormat.format(auto)`    |        0.35 |       0.60 |
| `Locale.new`                         |        0.35 |       0.93 |
| `Locale.new(options)`                |        1.55 |       4.89 |
| `Locale.new(zh-HK)`                  |        0.35 |       1.36 |
| `Locale.new.language`                |        0.43 |       1.28 |
| `Locale.new.toString`                |        0.41 |       1.00 |
| `Locale.language`                    |        0.07 |       0.09 |
| `Locale.new(Locale)`                 |        0.32 |       0.97 |
| `Locale.new(diverse)`                |        2.06 |       1.44 |
| `Locale.new(long)`                   |        2.78 |       3.84 |
| `PluralRules.new`                    |        1.21 |       4.73 |
| `PluralRules.new(options)`           |        2.42 |       4.98 |
| `ListFormat.new`                     |        1.32 |       2.88 |
| `ListFormat.new(default)`            |        1.07 |       2.56 |
| `ListFormat.new(array)`              |        1.58 |       2.87 |
| `ListFormat.new(options)`            |        2.36 |       2.79 |
| `ListFormat.new(fallback)`           |        1.95 |       3.58 |
| `ListFormat.new(unsupported)`        |        2.13 |       3.77 |
| `RelativeTimeFormat.new`             |        3.63 |       4.61 |
| `RelativeTimeFormat.new(fallback)`   |        4.61 |       5.62 |

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

Canonicalization now retains at most 64 validated short tag strings against
immutable compiled alias data. Input/output lengths above 128 UTF-16 units bypass
admission. Strings and branded Locale inputs return fresh singleton arrays
directly; general lists retain full traversal, coercion and duplicate removal.

Three alternating optimized runs against `a93e8cf5` cut repeated
`getCanonicalLocales` from 0.79 to 0.07 µs, ListFormat string construction from
2.17 to 1.59 µs and RTF construction from 5.25 to 4.70 µs. Optimized magrinj
measures 1.11, 2.68 and 4.65 µs. Explicit ListFormat/PluralRules options and
several steady-state paths still trail the comparator.

`canonical-tag-control.js` separately cycles 160 tags and exercises long strings
that bypass admission. Final repeated/diverse/long medians are 0.07/0.95/2.72 µs,
versus 0.79/1.05/2.93 µs before and 1.12/0.99/3.06 µs in magrinj. A cache-only
prototype improved repeated tags but slowed misses; its source, preflight outputs
and profile remain in the results file. Singleton construction recovers that cost.

Mixed `Locale.new(diverse)` moves from 3.85 to 4.61 µs and the long-tag control
from 6.35 to 6.84 µs. Extracting those exact cases/harness into optimized
`locale-control.js` reverses the direction: 4.43 to 3.75 µs and 6.96 to 6.23 µs.
The Rust archive and Locale source/contrib factories compare byte-identical.
The cause remains unproven; both mixed and isolated runs remain recorded.

All 342 final values are checked. The same 50,000-RTF-constructor profile has
24 of 200 samples in native canonicalization before, and none of 173 after.
Resolution and final record creation now dominate host samples. These frames
still aggregate C++ and Rust.

RTF now binds private WeakMap methods once and calls the captured
`getCanonicalLocales` directly. The intrinsic ignores its receiver. This removes
per-call reflective argument arrays. Poisoning WeakMap methods, Function.bind
and the public canonicalizer after installation cannot change formatting or brands.

With the same console clock patch on both native hosts, three paired runs reduce
numeric formatting from 1.07 to 1.03 µs, decimals from 1.39 to 1.35 µs, auto forms
from 0.53 to 0.49 µs and parts from 3.14 to 3.09 µs. Constructors stay near
4.46/5.26 µs, versus magrinj's 4.61/5.35 µs. Numeric formatting and parts still
trail magrinj's 0.71/2.14 µs. The fully bound prototype and all 342 final values
remain in the results file.

Locale's long control again reverses between workloads: mixed 6.64 to 6.00 µs,
isolated 5.94 to 6.37 µs. Both remain recorded; no causal explanation is claimed.
The steady-format profile removes `Reflect.apply` samples; native formatting
still accounts for most time and includes C++ plus Rust work.

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

The standard decimal core retains its numeric part buffer. Relative formatting
borrows long-style field keys and transfers part strings at the final numeric
slot, borrowing earlier repeated slots. Integer string/parts allocation calls
fall from 11/13 to 9/9; grouped decimals from 17/24 to 15/15; large-number
parts from 50 to 33. Separate Bazel probes count allocations and time the
uninstrumented core:

```sh
bazel run -c opt //benchmarks/hermes-intl-extension:relative_allocation_probe
bazel run -c opt //benchmarks/hermes-intl-extension:relative_format_probe
```

Three full Hermes runs reduce RTF string formatting from 1.023 to 0.985 µs,
grouped decimals from 1.343 to 1.303 µs and parts from 3.087 to 3.029 µs.
Default construction moves from 4.36 to 4.48 µs despite no constructor changes;
all cases and controls remain in the raw file. Numeric formatting and parts
remain slower than magrinj. Format profiles still concentrate in the native
host call; parts also spend heavily in JSON parsing. Profile samples aggregate
C++ and Rust and do not isolate allocator time.

The paired run checks 342 values with optimized bytecode on all hosts. Focused
Rust, Hermes, Test262 and pinned ICU4C/J/X relative-time checks pass; explicit
ICU4X separator differences stay recorded rather than normalized.

RTF parts now pass pre-coerced numeric text and UTF-16 unit strings directly to
Rust, sharing validation with string formatting. The old path built a JSON
request and traversed every unit code through Reflect.apply. Output parts still
use JSON; Rust owns all unit validation and serialization.

Three alternating optimized runs reduce parts from 3.094 to 1.738 µs (44%),
versus magrinj at 2.181 µs. Plain/decimal strings move from 0.986/1.319 to
0.969/1.299 µs. Default/fallback constructors move from 4.29/5.14 to
4.41/5.24 µs despite no constructor changes; their raw ranges remain available.
The parts profile removes request-building concatenation and JSON stringification;
JSON output parsing remains substantial. Before profiles reuse the exact previous
SDK capture; after profiles use the new SDK.

All 342 benchmark value checks match. Rust/TS differential, Hermes source/bytecode,
Test262 and pinned ICU4C/J/X RTF checks pass. New ABI checks cover negative zero,
grouping, large numbers, named forms, invalid units and pointer error statuses.

The isolated diverse-Locale control rises from 3.59 to 4.07 µs and repeats at
3.47 to 4.05 µs without CPU affinity. A three-run recheck pinned to CPU 0
reverses that result: 2.97 to 2.82 µs; long Locale is 4.47 to 4.40 µs.
Locale sources are unchanged. All trials remain recorded; timing-context
sensitivity is unresolved, so these results do not establish absence of a
Locale regression across environments.

PluralRules ranges now pass mathematical endpoint text and BigInt flags directly
to Rust and return a category index. JS still brands the receiver, rejects either
undefined endpoint before conversion, then coerces start and end in order. Rust
still parses, clamps Number inputs, rounds and rejects NaN after both conversions.

Three complete optimized comparisons pinned to CPU 0 reduce range selection
from 2.178 to 1.067 µs (51%); magrinj is 0.892 µs. Other single-value cases move
by roughly 1% or less. All 342 output checks pass. Fresh paired million-call
profiles drop from 2,030 to 1,106 samples; per-call JSON request/result work is
gone. The remaining profile concentrates in the native host call (74%) and
`mathematical` (11%). Samples aggregate C++ and Rust.

CPU affinity differs from historical unpinned tables. Compare changes within
this paired run; all raw cases and isolated Locale controls remain recorded.
The diverse Locale control is 2.86 versus 2.75 µs and long Locale 4.52 versus
4.53 µs. Neither Locale implementation changed.

Conformance adds 224 cardinal ranges over 14 locales. ICU4J fixtures are checked
independently by ICU4C and ICU4X, then consumed by actual Hermes source/bytecode
installers. Eighteen raw differences remain explicit, including equal endpoints
and missing-pair fallback; no outputs are normalized. Default-digit cardinal
coverage does not replace the broader TS ordinal/rounding/BigInt differential.

Shared mathematical normalization now returns canonical ASCII plain decimals
of at most 308 bytes directly. Such text cannot overflow or underflow Number,
and already has the general parser's output form. This saves temporary digit
strings and floating-point parsing without changing mathematical values.
Normalization allocation calls fall from 4 to 1, ordinary plural selection from
5 to 2 and ranges from 12 to 6. Separate instrumented and timing probes retain
noncanonical, exponent and 308/309-byte boundary controls:

```sh
bazel run -c opt //benchmarks/hermes-intl-extension:mathematical_allocation_probe
bazel run -c opt //benchmarks/hermes-intl-extension:mathematical_probe
```

Three complete optimized CPU-0-pinned comparisons reduce numeric plural
selection from 0.507 to 0.365 µs, decimals from 0.582 to 0.415 µs and ranges
from 1.072 to 0.776 µs. All six measured steady-state plural cases now beat
magrinj (0.451, 0.455 and 0.886 µs for those three cases). Explicit-options
construction remains slower, 5.81 versus 5.05 µs. Default construction shifts
from 2.08 to 2.16 µs; all raw cases remain recorded. Isolated diverse/long Locale
controls are 2.93/4.43 versus 2.76/4.40 µs.

Fresh profiles reduce the single-selection host samples from 3,538 to 2,411
and range host samples from 791 to 537 for fixed workloads. Ten focused checks
pass, including both NumberFormat/PluralRules Test262 suites, mathematical and
digit differentials, and the inherited ICU4C/J/X matrix. All 342 benchmark values
match; neither numeric output caching nor changed coercion is involved.

PluralRules retains its private enum/increment tables at installation, binds the
private slot setter once and calls captured canonicalization directly. Explicit
options serialize validated ASCII enums and bounded integers directly, omitting
undefined digit fields. Getter order and Rust rounding/default resolution remain
covered; no temporary option record or whole-record JSON stringification is needed.

Three optimized CPU-0-pinned comparisons cut default construction from 2.185 to
1.974 µs and explicit options from 5.915 to 5.193 µs. Magrinj measures 4.692 and
5.288 µs. All eight measured plural cases now have lower medians; the explicit
constructor lead is only 1.8%, with overlapping cross-run ranges. Full samples
remain available rather than claiming a broad lead across environments.

Fresh default/options profiles retain fixed 500,000/200,000 constructions. The
explicit profile falls from 1,036 to 853 samples; whole-record JSON work disappears,
while locale-tag quoting still uses captured JSON stringification. Native creation
and JS constructor work remain substantial. Rust sources are byte-identical across
the pair. Diverse/long Locale controls move from 3.15/4.48 to 2.39/4.26 µs despite
unchanged Locale sources; these controls are retained without attributing their
shift to this optimization.

All 342 value checks pass. Hermes source/bytecode, Test262 and the pinned
ICU4C/J/X matrix pass; intrinsic-poisoning coverage now includes replacing
Function.prototype.bind after installation. The SDK's nine API smoke scripts pass.

ListFormat's private iterable copy drops its array prototype on the first valid
string, then appends with direct index writes. This removes per-element descriptor
calls while retaining actual iteration, IteratorClose and inherited-setter
protection. Empty lists avoid prototype mutation. Public parts arrays/records
retain ordinary prototypes and descriptors.

Three complete optimized CPU-0-pinned runs reduce three-item strings from 1.091
to 0.955 µs (12.5%) and parts from 3.241 to 3.175 µs. Magrinj measures 0.532
and 3.255 µs. Size controls cover 0/1/3/32/256 items; 32 items improve from
5.779 to 4.354 µs and 256 from 39.439 to 27.651 µs. Strings remain slower than
magrinj at every size. Empty/single-item medians improve from 0.282/0.514 to
0.259/0.474 µs.

Unchanged constructor paths shift too: omitted-option construction from 0.972
to 1.057 µs and explicit options from 2.859 to 2.905 µs. All raw cases remain
recorded; this run does not establish absence of constructor regressions. Rust
sources and the C++ bridge are unchanged. Plain-format profiles remove the
`objectDefineProperty` frame (205 before samples); remaining time concentrates
in the host call and iterable copying. Public parts still need descriptor writes.

All 387 values match across complete runs, canonical/Locale controls and size
controls, with only the previously documented default-locale comparator choices.
Hermes source/bytecode, Test262, the ICU4C/J/X list matrices and nine SDK API
smokes pass. Intrinsic poisoning now also replaces Object.setPrototypeOf after
installation.

Rust ListFormat now streams forward patterns through borrowed slices, avoiding
arena/task storage. Reversed or decorated patterns retain the general traversal;
contextual Spanish/Hebrew choices remain unchanged. Output strings reserve the
input UTF-16 length as a lower bound. Adjacent fields keep empty element parts
without inventing empty literal parts.

Three complete optimized CPU-0-pinned comparisons reduce three-item strings from
0.963 to 0.759 µs (21.2%) and parts from 3.173 to 3.030 µs (4.5%). Magrinj
measures 0.547 and 3.250 µs. At 32/256 items strings improve from 4.369/27.808
to 3.602/23.917 µs; magrinj remains faster at 2.429/16.275 µs. Empty/single-item
controls measure 0.261/0.432 µs after, versus 0.264/0.476 before.

Instrumented Rust diagnostics reduce three-item string allocations from eight
to two, singleton allocations from three to one; 32/256-item strings also need
two. Three-item parts fall from eleven to seven allocations. Separate diagnostic
timings and the discarded parts-capacity prototype remain recorded; these are
not SDK benchmark results. Profiles reduce plain host-call samples from 582 to
378 and parts host-call samples from 241 to 203.

All 387 output checks pass. Eleven focused gates include pinned ICU4C/J/X list
comparisons, ListFormat Test262, dependent DurationFormat conformance and strict
Test262; nine SDK smoke scripts pass. Cold diverse/long Locale cases in the full
workload worsen from 2.947/4.480 to 3.236/4.778 µs despite unchanged Locale
sources. Isolated controls shift from 2.855/4.405 to 2.862/4.472 µs; cause is
unproven. Explicit PluralRules/ListFormat constructors still trail magrinj at
5.290/2.887 versus 5.198/2.813 µs. Remaining gaps stay open.

ListFormat retains private option enum arrays, binds its WeakMap methods once,
and calls captured canonicalization directly. Validated type/style enums use
direct JSON serialization; locale tags still use captured JSON quoting. Option
getter order, real iteration, public parts and intrinsic capture remain intact.

Three optimized CPU-0-pinned complete comparisons reduce explicit-options
construction from 2.926 to 2.455 µs (16.1%), ahead of magrinj's 2.783 µs.
Strings improve from 0.749 to 0.724 µs; magrinj remains faster at 0.538 µs.
Parts worsen from 3.011 to 3.090 µs (2.6%), still ahead of magrinj's 3.297 µs.
Default `en` and unsupported construction worsen from 1.192/2.260 to
1.302/2.432 µs in the full workload. Separate constructor controls remain
recorded below; these trials do not establish absence of regressions.

Constructor profiles fall from 455 to 387 samples, including JSON.stringify
from 47 to 13. Rust sources and the C++ bridge are unchanged. Five focused gates
cover Hermes source/bytecode, Test262, the Chromium matrix and pinned ICU4C/J/X
comparisons; all nine SDK API smoke scripts pass. Intrinsic-poisoning coverage
also replaces Function.prototype.bind after installation and constructs explicit
options. Remaining string, RelativeTimeFormat, cold Locale and explicit-options
PluralRules gaps stay open.

Separate three-round constructor controls measure explicit options at
2.925/2.360/2.727 µs (before/after/magrinj). `en` construction worsens
1.254 to 1.339 µs; omitted locales improve 1.021 to 0.946 µs and unsupported
locales improve 2.290 to 2.054 µs. All 423 values match, retaining only the
known omitted/unsupported comparator default-locale choices. This closes the
explicit-options ListFormat gap in these comparisons, with the measured `en`
constructor and parts regressions retained rather than hidden.

Canonicalization now borrows the language identifier before its first extension,
then canonicalizes only the extension suffix. A first private-use extension is
copied and lowercased directly after full structural validation: private subtags
have no aliases or internal ordering. Base aliases still use ICU4X; other
extensions retain existing processing.

Three optimized CPU-0-pinned complete comparisons reduce cold diverse Locale
construction from 3.012 to 2.490 µs (17.3%) and long tags from 4.303 to 3.476 µs
(19.2%). Magrinj measures 1.429/3.815 µs. Separate Locale controls improve
2.417/4.621 to 1.818/3.621 µs, versus magrinj 1.442/3.821 µs. Cold diverse
construction remains slower; long tags lead in both workloads. Canonical-tag
controls improve diverse/long from 0.890/2.586 to 0.627/1.299 µs, versus
magrinj 0.985/3.042 µs. Repeated tags remain near 0.070 µs.

Rust diagnostics reduce private-tag canonicalization allocations from 16 to 3
and long tags from 40 to 6; full Locale allocations fall 21 to 8 and 48 to 14.
Separate unpinned Rust timing runs put long Locale construction near 2,504 ns
before and 1,363 ns after; these are diagnostics, not SDK benchmark results.
Native host-call profile samples fall 395 to 306 for cold tags and 285 to 186
for long tags. Total samples fall 641 to 541 and 340 to 244.

All 423 benchmark output checks pass. Seventy broad gates pass, including the
native Hermes API suites, Hermes Test262 suite with existing baselines, strict
getCanonicalLocales, and all pinned ICU4C/J/X comparisons. A new 21-case corpus
independently checks aliases, casing, zh-TW/zh-HK, single-character private
subtags, long suffixes and preceding Unicode extensions. All nine SDK API smoke
scripts pass.

Separate ListFormat constructor controls shift `en`/omitted locales from
1.113/0.945 to 1.227/1.034 µs despite unchanged JS and C++ sources. The complete
workload does not show comparable shifts; raw controls remain recorded without
attributing their cause. RTF integer/decimal medians worsen 2.1%/2.7% in the full
workload. String ListFormat, RTF, cold diverse Locale and explicit-options
PluralRules gaps remain open.

NumberFormat now reads grouping intervals through a reverse split iterator and
emits integer chunks from the leading group forward. Pattern-group and chunk
vectors disappear; rounding, grouping thresholds, digit mapping, separators,
signs and exact public parts retain the common path. Boundary tests cover
Western/Indian groups, min2 and negative decimal parts.

Three optimized CPU-0-pinned comparisons reduce RTF strings from 0.980 to
0.954 µs (2.7%), decimal strings from 1.303 to 1.260 µs (3.3%) and parts from
1.744 to 1.683 µs (3.5%). Every paired round improves both string cases.
Magrinj measures 0.713/0.798/2.186 µs; string gaps remain. Instrumented Rust
RTF allocations fall from 9 to 8 for integers, 15 to 13 for grouped decimals
and 30 to 27 for 1e+21. Separate timing diagnostics remain recorded.

Fresh profiles reduce integer total/native-host samples from 931/782 to 878/702
and decimal samples from 626/525 to 578/493. Parts totals stay 233 samples
before/after. Profiles use the exact optimized SDK hosts and fresh paired
workloads, without concurrent timing or builds.

All 423 value checks, 17 consumer gates and nine SDK smoke scripts pass.
Coverage includes NumberFormat/RTF conformance, dependent Duration/DateTime,
Hermes Test262, Chromium locales and pinned ICU4C/J/X relative-time outputs.
RTF construction worsens from 4.086 to 4.366 µs (6.9%) and omitted ListFormat
construction from 0.954 to 1.025 µs (7.4%); neither constructor path calls the
changed grouping traversal. Causes remain unproven and raw controls stay
recorded. Both constructors still beat magrinj in this run. Cold diverse
Locale and explicit-options PluralRules also remain slower than magrinj.

NumberFormat shares a borrowed number-piece visitor between text and owned
parts. Latin digits use their immutable identity mapping; symbols borrow the
locale data. Other digit systems retain owned mapping. The decimal string/plural
API uses the same rendered number and category as parts. The plain
`#,##0.###` pattern writes directly; other patterns retain the general fallback.
RTF string templates reuse formatted text, while parts retain final-slot buffer
transfer and cloning only for repeated earlier slots.

Three optimized CPU-0-pinned comparisons improve RTF integer strings from 0.949
to 0.875 µs (7.8%), decimals from 1.272 to 0.988 µs (22.3%), and parts from
1.694 to 1.676 µs (1.1%). Every paired round improves both string cases.
Magrinj measures 0.711/0.785/2.181 µs; both string gaps remain. Rust string
allocations fall 8 to 7 for integers, 13 to 7 for grouped decimals and 27 to 10
for 1e+21. Parts allocation counts remain unchanged. Separate unpinned diagnostics
reduce integer/decimal core times from 514/774 to 450/558 ns.

Decimal total/native profile samples fall 649/550 to 456/393. Integer totals are
nearly flat at 872/878, despite the complete benchmark improvement; parts totals
fall 256 to 226. Profiles and diagnostics remain separate from SDK timing claims.

All 423 output checks, 17 consumer gates and nine SDK smokes pass, including
pinned ICU4C/J/X comparisons. Direct tests cover signs, Arabic digits, visible
fractions, rounding categories and Indian-pattern fallback. Existing repeated
slots and empty named forms retain exact parts boundaries.

Unchanged Locale code worsens in this comparison: full-workload diverse/long
construction moves 2.428/3.192 to 2.602/3.623 µs; isolated controls move
1.834/3.415 to 2.056/3.636 µs. Cause remains unproven. Long tags still beat
magrinj, but diverse Locale remains slower. Raw results also retain a 4.3%
unsupported ListFormat constructor regression. Explicit-options PluralRules
still trails magrinj at 5.177 versus 5.139 µs; that narrow gap remains open.

Hermes RTF now sends pre-coerced doubles directly through JSI and the C ABI.
Rust retains the double for validation, direction and named forms. Numeric
patterns lazily convert its absolute magnitude with a stack `ryu` buffer;
JavaScript no longer allocates a numeric string. Existing text methods and ABI
remain available. Unit strings retain UTF-16 transport and validation.

Three optimized CPU-0-pinned comparisons move integer/decimal/parts/auto
medians from 0.871/0.991/1.661/0.461 to 0.803/0.941/1.588/0.344 µs
(7.8%/5.0%/4.4%/25.4% improvements). Magrinj measures 0.719/0.793/2.157/0.597 µs.
Integer and decimal string gaps remain. Separate four-case RTF controls retain
all three hosts' raw results; a unit-code lookup trial was slower than retaining
UTF-16 units across every isolated case and was excluded.

All 459 output checks pass. The 19,008-case pinned ICU4X matrix now checks
numeric versus text formatting and exact parts equality. ICU4C/J verify its
1,440 pinned differences; no new differences are accepted. Seventeen consumer
gates and nine SDK smoke scripts pass. Native source/bytecode add rounding
neighbors, exponent thresholds, subnormals and maximum finite doubles; ABI
checks preserve signed zero, nonfinite errors and output cleanup.

Rust diagnostics and SDK profiles remain separate from timing claims. The
numeric Rust method alone includes decimal conversion work formerly done by
JavaScript, so its core timing does not independently improve. SDK gains come
from removing cross-boundary conversion and skipping it for named forms.

ListFormat strings and cold diverse Locale remain slower than magrinj.

Isolated diverse/long Locale controls worsen from 1.859/2.898 to 1.971/3.048 µs
(6.0%/5.2%) despite unchanged Locale code. Cause remains unproven; the full
workload shows no comparable regression. Explicit-options PluralRules remains
close to magrinj and needs more headroom.

ListFormat keeps borrowed UTF-16 input references on the Rust stack for up to
eight elements. The C++ bridge keeps up to four UTF-16 strings and ABI slices
on its stack; longer lists retain heap buffers. Empty lists return before
input-buffer setup. JS still consumes the real iterator, reads each element
once, closes on invalid values and protects its private copy from inherited
index setters. All input and output strings retain lone surrogates.

String formatting moves 0.703 to 0.675 µs (4.0% improvement), versus magrinj 0.529 µs. Parts moves 3.015 to 2.987 µs (0.9% improvement), versus magrinj 3.237 µs.

- `ListFormat.format(size=0)`: 0.233 to 0.225 µs; magrinj 0.256 µs.
- `ListFormat.format(size=1)`: 0.395 to 0.377 µs; magrinj 0.386 µs.
- `ListFormat.format(size=3)`: 0.696 to 0.659 µs; magrinj 0.529 µs.
- `ListFormat.format(size=32)`: 3.493 to 3.416 µs; magrinj 2.402 µs.
- `ListFormat.format(size=256)`: 23.491 to 22.976 µs; magrinj 16.077 µs.

All 459 benchmark output checks, eleven consumer gates and nine SDK smokes
pass, including pinned ICU4C/J/X list comparisons, Hermes ListFormat Test262
and dependent DurationFormat suites. New ABI boundary coverage checks empty
and surrogate elements, exact encoded parts and malformed final-slice cleanup
at lengths 0/1/7/8/9/32.

Rust diagnostics remove one allocation for nonempty lists of up to eight items;
large-list allocation counts stay unchanged. C++ also avoids its two input
container allocations for up to four items. These counters exclude Hermes JS
allocations; separate timing probes and sampling profiles remain diagnostics.
Format total profile samples: 654 before, 602 after.
Parts total profile samples: 888 before, 842 after.

Other full-workload regressions: `Locale.new(diverse)` 1.915 to 2.304 µs (20.3%). Causes remain unproven; raw controls remain recorded.

String ListFormat, numeric RTF strings and cold diverse Locale gaps remain open.

Release SDK archive transitions now enable cross-crate ThinLTO for Linux and
macOS. Compiler-action records confirm the earlier `opt-level=3` build disabled
embedded bitcode; the new archives use `-Clto=thin`. Formatter implementations
and public ABI stay the same. Other repository build defaults retain their
existing settings.

The full API harness now compiles the TS reference and workload with Hermes
`-O`, uses the same monotonic clock, and allows enough calibration calls for
fast operations. Use these paired measurements for code effects; the historical
full-API table used `Date.now()`.

`RelativeTimeFormat.format` moves 0.826 to 0.795 µs (-3.8%); magrinj 0.717 µs.
`RelativeTimeFormat.format(decimal)` moves 0.918 to 0.898 µs (-2.2%); magrinj 0.789 µs.
`RelativeTimeFormat.formatToParts` moves 1.637 to 1.588 µs (-3.0%); magrinj 2.181 µs.
`Locale.new(diverse)` moves 2.191 to 2.451 µs (+11.9%); magrinj 1.449 µs.
`PluralRules.new(options)` moves 5.345 to 4.997 µs (-6.5%); magrinj 5.074 µs.

Isolated `Locale.new(diverse)`: 1.864 to 2.015 µs; magrinj 1.465 µs.
Isolated `Locale.new(long)`: 3.585 to 3.557 µs; magrinj 3.823 µs.

Full shared-workload regressions: `Locale.new(diverse)` 2.191 to 2.451 µs (11.9%). Raw controls retain those results; causes remain unproven.

The linked benchmark executable shrinks from 571.0 to 564.5 MiB
(1.1%). This includes the full embedded locale data and Hermes;
it is not a standalone formatter code-size measurement.

All 459 shared output checks and 84 full-API native/TS assertions pass. Seventy
broad gates pass under ThinLTO, including Hermes Test262, native and Rust suites,
Chromium locales and pinned ICU4C/J/X comparisons. Both release archives build;
the actual default SDK passes all nine standalone API smokes. Earlier pilot
measurements remain separate from the final three-round comparison.

Format total profile samples: 766 before, 823 after.
Decimal total profile samples: 426 before, 457 after.
List total profile samples: 610 before, 643 after.
Locale total profile samples: 543 before, 570 after.

Sampling profiles remain diagnostics rather than independent low-percent timing
claims. No clean-build-time comparison is made. String ListFormat, numeric RTF
strings and cold diverse Locale still need work; narrow constructor wins need
more headroom.

Locale construction now skips JSON parsing and unused option processing for the
bridge's exact empty object, using the same Rust tag canonicalization and record
parser. Explicit options retain their existing validation order.
[Paired SDK results and profiles](locale-empty-options-results.json).

Three alternating optimized control runs: cold diverse tags 1.823 to 1.671 µs
(-8.4%), magrinj 1.432 µs; long uncached tags 3.074 to 2.742 µs (-10.8%),
magrinj 3.791 µs. Warm constructors stay within 1% of baseline.
A separate fixed-work source diagnostic uses nine 300,000-call batches per
invocation, five invocations per host: 2.252 to 2.117 µs (-6.0%), magrinj 1.437 µs.
This diagnostic uses source rather than the optimized-bytecode control.

The earlier four-host pilot showed a cold-tag regression; its raw values remain
in the dataset. Final controls and fixed-work runs improve, but GC and run-to-run
variance limit low-percent claims. Cold diverse tags still trail magrinj.

A C++ consumer of the shipped Rust archive compares exact `{}` with whitespace
empty JSON in the same executable: private-tag construction is roughly 467
versus 556 ns. Allocation counts stay unchanged. Separate Hermes profiles total
1,673 versus 1,543 samples, including 971 versus 883 in `localeCreate`; profiles
are diagnostics rather than independent timing claims.

All 120 pilot/final control values, 84 full-API native/TS assertions, 12 focused
Locale gates and nine SDK smokes pass. Gates include strict canonicalization and
Locale Test262, Chromium locales and pinned ICU4C/J/X comparisons. Direct ABI
tests compare empty-object encodings for aliases, Chinese regions, extensions,
properties and transforms, plus invalid-tag status and null output handling.
The full-API native timing changes range from -4.1% to +4.5%; raw runs remain
recorded.

RelativeTimeFormat now reuses rounded Latin text for standard decimals with at
most six integer digits, sharing the parts path's grouping thresholds. Other
cases keep their existing traversal. A pattern starting with its final number
slot takes that string buffer before appending literals; repeated slots still
retain their number text.
[Paired SDK results, controls and profiles](rtf-text-buffer-results.json).

Three alternating optimized shared-workload runs: integer RTF 0.818 to 0.735 µs
(-10.2%), magrinj 0.741 µs; decimal RTF 0.904 to 0.860 µs (-4.9%),
magrinj 0.812 µs. Isolated RTF controls confirm 0.798 to 0.731 µs for integers
and 0.887 to 0.850 µs for decimals. Integer results approach parity rather than
establish a robust win. Parts move 1.612 to 1.638 µs (+1.6%); magrinj 2.250 µs.

Common Rust numeric string cases remove one allocation; large values retain
their previous allocation counts. Rust timing probes remain unpinned diagnostics.
Separate profile totals are mixed: integer 753 to 730 samples; decimal 420 to 451. Paired benchmark timings, rather than profile counts, support speed claims.

All 459 shared output checks, 84 full-API native/TS assertions, 17 focused gates
and nine standalone SDK smokes pass. Gates include pinned ICU4C/J/X RTF
comparisons, NumberFormat/RTF/DurationFormat Test262 and dependent DateTimeFormat
conformance. Direct tests cover multibyte separators, min2/always/disabled
grouping, rounding into seven digits, signs, special values and repeated slots.
No full-API native scenario regresses by 5% or more in this comparison.

Cold Locale remains variable: shared workload 2.178 to 2.405 µs (+10.4%); isolated
1.886 to 1.885 µs (flat). Isolated long tags move 3.096 to 3.246 µs (+4.9%).
Causes remain unproven; raw values stay recorded. String ListFormat, decimal RTF
and cold Locale remain slower than magrinj; explicit PluralRules constructors
remain close to parity and need more headroom.

The shared digit formatter now returns canonical unsigned decimals directly when
fraction precision, increment and minimum width require no rounding or padding.
Other inputs retain the existing decimal engine or huge-integer path.
[Paired SDK results, controls and profiles](exact-decimal-results.json).

Three alternating optimized shared runs: integer RTF 0.714 to 0.657 µs (-8.0%),
magrinj 0.712 µs; decimal RTF 0.837 to 0.762 µs (-8.9%), magrinj 0.783 µs.
Isolated controls confirm 0.709 to 0.642 µs and 0.826 to 0.738 µs respectively.
Both numeric strings lead the comparator on this host; the decimal margin is
small. PluralRules selection cases improve 13–18%; integer select is 0.345 to
0.282 µs, magrinj 0.453 µs. Allocation counts stay unchanged.

Additional source-mode SDK controls improve signed zero, positive decimals and
large values. The rounding-carry case moves 0.735 to 0.742 µs (+0.9%). Initial
unpinned Rust zero timing was an outlier; the pinned rerun and SDK controls are
retained alongside it. Rust probes and profile counts are diagnostics.
Integer profile samples move 720 to 647; decimal samples move 392 to 412.

All 459 shared values, 30 numeric-edge checks, 84 full-API native/TS assertions,
73 broad gates and nine SDK smokes pass. Gates include pinned ICU4C/J/X and all
existing Hermes Test262 targets. Direct tests compare strings and errors with
the unchanged rounding engine across precision, padding, increment, priority,
signs, trailing zeros, malformed input, carry and huge-fraction limits. No
full-API native scenario regresses by 5% or more in this comparison.

String ListFormat still trails magrinj: 0.661 versus 0.529 µs. Cold Locale is
1.826 versus 1.414 µs in the shared workload and 1.647 versus 1.415 µs isolated.
Explicit PluralRules and fallback RTF constructors have narrow margins and need
more headroom. These results do not establish whole-goal completion.

ListFormat now retains its selected compiled templates. Pattern bodies cache
literal UTF-16 lengths; string formatting reserves exactly the element and
pattern units before traversal, including contextual and reversed patterns.
[Paired SDK results, controls and profiles](list-capacity-results.json).

Three alternating optimized shared runs: string formatting 0.683 to 0.625 µs
(-8.5%), magrinj 0.543 µs. Parts stay near 3.0 µs (3.001 to 3.012); magrinj
3.306 µs. Isolated three-item strings confirm 0.673 to 0.612 µs; 32-item strings
move 3.463 to 3.328 µs and 256-item strings 23.428 to 23.262 µs.

Common ABI calls with up to eight items remove two allocations (three to one
for three-item lists); larger lists move four to two. Empty/single-item counts
stay zero/one. Separate pinned Rust stages retain template-binding and size-cache
diagnostics; the three-item ABI probe moves 70 to 44 ns. These are diagnostics,
not independent SDK speedup claims. Cold locale-data loading is not timed.

All 459 shared values, 84 full-API native/TS assertions, 11 focused gates and nine
SDK smokes pass. Gates include pinned ICU4C/J/X list comparisons, ListFormat and
DurationFormat Test262, Chromium locales and dependent DurationFormat conformance.
The new unit checks all nine type/style combinations through both constructors
after registry/data release. Existing contextual, reversed, empty, surrogate and
20,000-item checks pass. No full-API native scenario regresses by 5% or more.

Constructor tradeoffs remain visible: shared ListFormat.new moves 1.266 to
1.290 µs (+1.9%); isolated default construction 0.898 to 0.984 µs (+9.6%). Both
remain faster than magrinj. Unrelated shared RTF construction moves 3.961 to
4.176 µs (+5.4%); its cause is unproven. Raw controls retain these results.
Cold Locale remains slower and variable: shared 2.624 versus magrinj 1.469 µs,
isolated 1.938 versus 1.474 µs. String ListFormat still trails; further work must
preserve observable iteration and UTF-16 semantics.

Short ListFormat calls now retain up to four validated strings in JS locals and
pass positional native arguments. The fifth item creates a private array with a
null prototype; subsequent items append directly. Both methods retain real
iterator traversal and share the existing C++ UTF-16 collector and Rust ABI.
[Paired SDK results, controls and profiles](list-short-arguments-results.json).

Three alternating optimized runs cut three-item string formatting from 0.602 to
0.427 µs (-29.1%); magrinj takes 0.530 µs. Parts move 2.931 to 2.871 µs (-2.0%),
versus 3.260 µs. Isolated empty/single/three-item strings improve 11.5%, 25.8%
and 31.0%. Source-mode boundary controls at four/five/eight/nine items verify
both paths; these diagnostic timings are separate from optimized workloads.

All 495 shared/control outputs, 84 full-API native/TS assertions, eleven focused
gates and nine actual SDK smokes pass. Gates include pinned ICU4C/J and ICU4X,
ListFormat/DurationFormat Test262 and dependent DurationFormat suites. New source
and optimized-package tests cover single getter reads, empty strings, Unicode,
lone surrogates, invalid elements at both buffer boundaries, IteratorClose error
precedence and inherited index setters. The tests also passed on the previous
implementation. Rust crate sources and both SDK Rust archives remain identical.
No full-API native scenario regresses by 5% or more.

Tradeoffs remain: 32-item strings move 3.260 to 3.315 µs (+1.7%), and 256-item
strings 22.815 to 23.573 µs (+3.3%); magrinj takes 2.411 and 16.213 µs. The
superseded switch loop regressed these cases 8–12%; raw runs and a separate
three-way loop probe are retained. Isolated default and explicit-locale ListFormat
construction regress about 8%, while shared array-locale construction regresses
9%; they still beat magrinj. Shared default construction improves, so do not
extrapolate one constructor control to every workload.

Cold Locale remains slower and variable: shared 2.143 versus magrinj 1.463 µs;
isolated 2.375 versus 1.434 µs, with an unrelated 21.2% before/after regression.
Its cause is unproven. Explicit PluralRules construction is effectively tied
(5.045 versus 5.039 µs). Long lists and cold Locale remain open performance gaps.

Rust Locale records now store language/script/region in bounded ASCII fields
(8/4/3 bytes), preserving valid 5–8-letter languages; extension singletons use
one ASCII byte. Public snapshots still return owned strings. Locale JS/C++ factory
files remain byte-identical across the compared SDKs.
[Paired SDK results, controls and profiles](locale-inline-results.json).

Three alternating optimized runs improve cold diverse Locale construction from
2.507 to 2.276 µs (-9.2%); isolated controls confirm 2.490 to 2.387 µs (-4.1%).
Magrinj remains faster at 1.513 µs shared and 1.503 µs isolated. Long tags move
3.873 to 3.261 µs (-15.8%), with isolated 3.798 to 3.353 µs (-11.7%); magrinj
takes 3.946/3.945 µs. Warm Locale cases remain within about 1%.

Separate pinned Rust probes remove two allocation calls for a private tag
(nine to seven through the ABI), one for plain language tags (five to four),
and five for an alias/Unicode-extension tag (37 to 32). Private-tag ABI timing
moves 479 to 443 ns. A rejected SmallVec subtag buffer removes another allocation
but slows that probe to 468 ns; its raw stages are retained, and it is not shipped.
These probes predate the option-order fixes and use default options; they are
diagnostics, not substitutes for SDK timings. Native `localeCreate` remains
the largest sampled frame; it aggregates C++ and Rust.

Unicode option updates also preserve extension boundaries in both implementations.
TS previously emitted `en-x-private-u-kn-true` when adding numeric options to
`en-x-private`; Rust could emit `en-u-kn-x-private-z-foo` for `en-z-foo-x-private`.
New Unicode options now precede private use, which stays last. Twelve shared
constructor-update fixtures agree independently with pinned ICU4C/J/X. They
cover numeric/calendar options, digit/v/y/z extensions, existing attributes and
private payloads containing `u`. Both original implementations failed their new
regressions; all 73 gates now pass, including TS unit/parity/Test262, Hermes
source/package and existing broader ICU comparisons. The actual SDK passes all
12 cases and 24 assertions, plus nine existing smoke scripts.

All 495 benchmark/control outputs and 84 full-API native/TS assertions pass.
The full native/TS bytecode bundle was rebuilt through Bazel after the TS fix;
both SDK hosts use that same updated bundle. No full-API native case regresses
by 5% or more. Sampling profiles and boundary-source timings remain diagnostics.

Tradeoffs remain: shared explicit-options ListFormat construction moves 2.393
to 2.519 µs (+5.2%), while isolated 2.313 to 2.306 µs is flat; the cause is
unproven. Explicit PluralRules construction moves 5.239 to 5.360 µs (+2.3%),
versus magrinj 5.079 µs. Long lists remain behind: 32 items take 3.385 versus
2.483 µs, and 256 take 24.120 versus 16.699 µs. Cold Locale, long lists and
explicit PluralRules construction remain open performance gaps.

Hermes PluralRules now reuses up to 64 immutable Rust constructor records after
locale negotiation and every observable option getter/coercion. Keys contain
the resolved locale and full serialized options; keys over 512 characters bypass
reuse. Successful locale loading clears reuse. Receivers and query results stay
fresh, and existing instances retain their selected locale payload.
[Paired SDK results, controls and profiles](plural-record-results.json).

Three alternating optimized SDK runs cut default construction from 1.976 to
1.219 µs (-38.3%) and explicit ordinal/fraction options from 5.274 to 2.462 µs
(-53.3%). Magrinj takes 4.753 and 5.292 µs respectively. Separate source controls
confirm the warm gains; 80 distinct option combinations stay flat at 4.795 to
4.801 µs. The reuse-only pilot regressed those misses 3.9%; the final version also
stops scanning the private increment table after a match. Both stages are kept
in the raw results rather than combined.

The explicit-constructor profile removes repeated `pluralCreate` calls: 1,002
self samples out of 2,139 become zero out of 1,117. `pluralMatch` stays at
189/188 samples. JS constructor self samples move 641 to 501; sampling remains
diagnostic. Rust crate sources and both SDK Rust archives are bit-identical.

All 513 benchmark/control outputs and 84 full-API native/TS assertions pass.
Thirteen focused gates after reuse cover dependent formatters, Chromium locales,
PluralRules Test262 and pinned ICU4C/J formatting plus ICU4X plural comparisons.
The final private-loop refinement reruns PluralRules source/package/Test262.
New tests passed before and after reuse: getter/coercion calls, original errors,
fresh instances/results, explicit-options locale-data replacement and 80 distinct
digit configurations with Map intrinsics poisoned. Nine actual SDK smokes and
the twelve ICU-agreed Locale regressions also pass. No full-API native case
regresses by 5% or more.

Unrelated tradeoffs remain visible: isolated default ListFormat construction
moves 1.039 to 1.151 µs (+10.7%), while the shared case improves 2.1%. Shared long
Locale tags move 3.012 to 3.205 µs (+6.4%); isolated 3.127 to 3.127 µs is flat.
Causes remain unproven. Cold Locale still trails magrinj: shared 2.242 versus
1.485 µs, isolated 1.947 versus 1.484 µs. Long lists also trail: 32 items take
3.417 versus 2.478 µs, and 256 take 23.957 versus 16.616 µs. These remain open
performance gaps.

Rust-authorized list joins keep observable iteration in Hermes while avoiding
JSI string copies when templates have fixed forward separators. Contextual,
reversed and custom patterns retain Rust formatting, as do all parts calls.
Private symbol metadata on the opaque handle avoids a second WeakMap. Lists
of 5–127 strings wait for reuse before querying a plan; larger lists can repay
setup immediately. Existing instances retain selected data after locale loading.
[Final paired SDK results and rejected prototypes](list-join-results.json).

Three alternating optimized-bytecode runs:

| List length | Before µs | After µs | Magrinj µs |
| ----------: | --------: | -------: | ---------: |
|           0 |     0.199 |    0.198 |      0.251 |
|           1 |     0.284 |    0.281 |      0.391 |
|           3 |     0.418 |    0.420 |      0.531 |
|          32 |     3.320 |    2.363 |      2.424 |
|         256 |    23.641 |   16.483 |     16.222 |

First-use source controls include construction plus one format call. These are
separate diagnostics, not mixed into optimized steady-state medians:

| List length | Before µs | After µs | Magrinj µs |
| ----------: | --------: | -------: | ---------: |
|           5 |     1.808 |    1.922 |      3.562 |
|          32 |     4.361 |    4.619 |      5.747 |
|         127 |    13.417 |   13.690 |     12.802 |
|         128 |    13.307 |   12.543 |     12.145 |
|         129 |    13.666 |   13.003 |     12.562 |
|         256 |    25.457 |   21.944 |     20.904 |

Setup still costs a plan query once, and small first-use calls also record a
private sentinel. The original first-query WeakMap prototype regressed cold
calls 22–96%; delaying the query alone retained excess weak-key collection work.
Both rejected stages, paired profiles and raw outputs remain in the results.

All 612 benchmark/control outputs and 84 full-API native/TS assertions pass.
Twelve focused gates include test262, dependent DurationFormat and all-CLDR
Rust/TS comparisons. The latter batches subprocess output rather than growing
its buffer. Shared ICU4C/J/Hermes coverage expands to 3,168 cases, including
long lists; ICU4X independently checks 3,069 scalar cases. Its 69 exact
allowlisted differences include three new Hebrew hyphen cases where C/J agree.
Another 99 lone-surrogate cases remain strict C/J/Hermes checks. First and reused
calls, contextual/custom fallback, iterator closing, tampering, locale-data
replacement and threshold boundaries all retain coverage.

The warm profile removes native `listFormat` self samples: 1,135 of 2,228
become zero of 1,576. Validation remains the largest frame. Cold 32-item
profiles retain seven young-generation collection samples on each host;
private metadata removes the extra weak-key work from the rejected prototype.
The descriptor typing fix passes the extension type checker and emits the
same factory bytes as the measured SDK.

No shared or full-API native case regresses by 5% or more. Separate cold
controls retain small first-call costs: five strings add 0.114 µs (+6.3%),
32 add 0.258 µs (+5.9%). Cold 256-item formatting improves 13.8%, but remains
21.944 versus magrinj's 20.904 µs. Warm 256-item formatting is 1.6% behind.
Cold Locale construction remains the main shared gap: 2.393 versus 1.447 µs;
the isolated control is 1.975 versus 1.463 µs. No overall parity claim.

### Direct language-independent aliases

[Paired SDK evidence](alias-independent-results.json) isolates direct access to
the generated language-independent alias slice. Rules and specificity stay
unchanged. Three CPU0-pinned rounds reverse host order in round two.

Cold diverse Locale construction moves 2.259 to 2.063 µs (-8.7%); isolated
control 2.335 to 1.926 µs (-17.5%). Magrinj remains faster at 1.435 and
1.462 µs. Long-tag construction moves 2.978 to 2.781 µs (-6.6%), versus
magrinj 3.837 µs. Options construction improves 11.7% to 1.545 µs.
Three-million-constructor runs move 6.494 to 5.727 seconds (-11.8%).

Hardware user-cycle sampling puts generated alias dispatch at 7.97% before,
0.16% after. Sampling runs precede final timings. Hermes timer changes affect
clock sampling; these native profiles use hardware cycles with clock sampling
disabled. Allocator and GC costs remain.

All 702 paired outputs match, apart from existing magrinj default-locale
choices. All 74 conformance gates pass, including pinned ICU4C 78.1, ICU4J 78.1
and ICU4X `icu_locale` 2.3.1 private-use canonicalization and Locale comparisons.
SDK smokes, 24 Locale extension assertions and 84 native/TS assertions pass.
No full native/TS case regresses 5%. Shared Russian plural selection moves
0.316 to 0.333 µs (+5.2%); cause unproven, retained in raw evidence. This is
one host; cold diverse Locale remains an open comparator gap.

### Streaming canonical Locale parsing

[Paired SDK evidence](locale-stream-results.json) replaces temporary subtag
vectors with borrowed slices and iterators. Canonical validation, public APIs,
private-use ordering and Unicode keyword behavior stay unchanged. Rust probes
remove one allocation on short tags and four on long private-use tags.

Long-tag construction improves 26.4% in the shared workload and 22.7% isolated.
Short cold construction measures +7.2% shared, -3.9% isolated and -4.5% in the
source control; cause of disagreement remains unproven. Three million cold
constructors move 5.957 to 5.768 seconds (-3.2%).
No native/TS full-suite case regresses 5%. All 74 conformance gates pass,
including pinned ICU4C/J/X comparisons; 702 paired outputs, 84 native/TS
assertions, SDK smokes and 24 Locale extension assertions pass.

New performance work targets the smallest gains over our TS polyfills:
ListFormat.formatToParts, Segmenter.segment and Collator.compare. Historical
magrinj results remain recorded, but no longer set the optimization target.

Segmenter records now use object literals with own data properties. Paired SDK
medians improve 6.43 to 4.01 µs (-37.7%), or 2.13× the corrected TS implementation.
ListFormat.parts and Collator controls differ by at most 2.4%. This measures
iteration over graphemes in `A🙂B`, including record creation and string joining.

Rust and TS word classification matches the independent 1,770-case ICU4C/J
matrix. Full TS Unicode 17 grapheme, word and sentence corpora run without skips.
Hermes source, bytecode and packaged SDK each pass 3,540 native/TS comparisons
and 219,613 assertions, including UTF-16 containing(), descriptors and freshness.

SDK sampling profiles attribute 412/1,800 samples to `objectDefineProperty`
before the change and 0/1,111 afterward; GC and bridge calls remain visible.

Collator comparisons now pass UTF-16 directly and return scalar ordering, keeping
JS coercion order and the existing Rust comparator. Paired optimized SDK medians
improve 1.68 to 0.855 µs (-49.0%), or 3.99× TS. No full-suite row regresses 5%.
Over three million comparisons, exclusive CPU time in comparison-query
deserializers falls from 0.277 seconds to zero; profiles retain constructor work.

Both hosts use Hermes `393a539e6` with the pinned BCR patches, including the Proxy
constructor fix. Both SDKs pass 8,680 native/TS comparisons and 17,934 assertions.
The release-only rebase preserves all implementation blobs and 93 runtime SDK
components byte for byte. The TS workload was rebuilt on the updated release base.
