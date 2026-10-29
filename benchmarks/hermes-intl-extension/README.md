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

| Operation                          | Native µs | TypeScript µs | Native speedup |
| ---------------------------------- | --------: | ------------: | -------------: |
| `getCanonicalLocales`              |      0.79 |          4.39 |          5.54x |
| `supportedValuesOf`                |      1.81 |         58.59 |         32.43x |
| `Locale.maximize`                  |      3.61 |         33.20 |          9.19x |
| `PluralRules.select`               |      0.65 |        125.00 |        193.21x |
| `ListFormat.format`                |      1.14 |          4.35 |          3.83x |
| `ListFormat.formatToParts`         |      4.54 |          6.05 |          1.33x |
| `DisplayNames.of`                  |      1.51 |          7.91 |          5.23x |
| `Segmenter.segment`                |      6.05 |          8.89 |          1.47x |
| `Collator.compare`                 |      1.61 |          3.22 |          2.00x |
| `NumberFormat.format`              |      2.44 |        350.00 |        143.36x |
| `RelativeTimeFormat.format`        |      1.10 |        406.25 |        369.78x |
| `RelativeTimeFormat.formatToParts` |      3.91 |        406.25 |        104.00x |
| `DateTimeFormat.format`            |      4.15 |       1012.50 |        243.95x |
| `DurationFormat.format`            |      3.96 |        887.50 |        224.40x |

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

| Operation                            | FormatJS µs | Magrinj µs |
| ------------------------------------ | ----------: | ---------: |
| `getCanonicalLocales`                |        0.76 |       1.42 |
| `Locale.maximize`                    |        3.85 |       2.55 |
| `PluralRules.select`                 |        0.60 |       0.56 |
| `ListFormat.format`                  |        1.04 |       0.69 |
| `ListFormat.formatToParts`           |        3.11 |       4.34 |
| `RelativeTimeFormat.format`          |        1.07 |       0.95 |
| `RelativeTimeFormat.formatToParts`   |        3.05 |       2.91 |
| `RelativeTimeFormat.format(decimal)` |        1.46 |       1.03 |
| `RelativeTimeFormat.format(auto)`    |        0.51 |       0.85 |
| `Locale.new`                         |        4.52 |       1.19 |
| `Locale.new(options)`                |        6.10 |       6.41 |
| `Locale.new(zh-HK)`                  |        5.13 |       1.62 |
| `PluralRules.new`                    |        7.45 |       5.51 |
| `ListFormat.new`                     |        3.36 |       3.25 |
| `ListFormat.new(fallback)`           |       16.36 |       4.14 |
| `ListFormat.new(unsupported)`        |       12.70 |       4.15 |
| `RelativeTimeFormat.new`             |       11.47 |       4.98 |

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
parts from 4.64 to 3.11 µs, versus magrinj's 4.34 µs (28% faster). Formatting
fell from 1.13 to 1.04 µs. Fresh records, descriptors, property order, poisoned
prototypes and all ICU outputs stay checked. [Raw samples](list-parts-results.json).
