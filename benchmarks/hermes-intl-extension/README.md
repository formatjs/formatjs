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
| `getCanonicalLocales`              |      0.83 |          4.44 |          5.35x |
| `supportedValuesOf`                |      1.78 |          59.4 |          33.3x |
| `Locale.maximize`                  |      4.83 |          33.2 |          6.87x |
| `PluralRules.select`               |      0.65 |           122 |           188x |
| `ListFormat.format`                |      1.21 |          3.91 |          3.23x |
| `ListFormat.formatToParts`         |      6.05 |          5.47 |          0.90x |
| `DisplayNames.of`                  |      1.54 |          7.81 |          5.08x |
| `Segmenter.segment`                |      6.05 |          8.89 |          1.47x |
| `Collator.compare`                 |      1.64 |          3.17 |          1.94x |
| `NumberFormat.format`              |      2.39 |           344 |           144x |
| `RelativeTimeFormat.format`        |      1.10 |           400 |           364x |
| `RelativeTimeFormat.formatToParts` |      4.00 |           400 |          99.9x |
| `DateTimeFormat.format`            |      4.10 |         1,000 |           244x |
| `DurationFormat.format`            |      4.00 |           900 |           225x |

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
| `getCanonicalLocales`                |        0.79 |       1.43 |
| `Locale.maximize`                    |        5.86 |       2.57 |
| `PluralRules.select`                 |        0.63 |       0.56 |
| `ListFormat.format`                  |        1.11 |       0.69 |
| `ListFormat.formatToParts`           |        4.70 |       4.37 |
| `RelativeTimeFormat.format`          |        1.07 |       0.95 |
| `RelativeTimeFormat.format(decimal)` |        1.50 |       1.04 |
| `RelativeTimeFormat.format(auto)`    |        0.52 |       0.85 |
| `RelativeTimeFormat.formatToParts`   |        3.17 |       2.89 |
| `Locale.new`                         |        6.96 |       1.21 |
| `PluralRules.new`                    |        7.45 |       5.71 |
| `ListFormat.new`                     |        3.30 |       3.40 |
| `ListFormat.new(fallback)`           |       7,875 |       4.32 |
| `ListFormat.new(unsupported)`        |      11,000 |       4.31 |
| `RelativeTimeFormat.new`             |        13.2 |       5.50 |

The decimal case formats -1234.5 days; auto formats -1 day as "yesterday".
These parts timings read array length, whereas the full suite serializes parts.
Our ListFormat bridge preserves lone surrogates and reads array getters once;
magrinj's shortcut does neither.

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
to `en-GB` and `en`, respectively; magrinj resolves them to `en` and `en-US`.
These cases compare constructor cost with different matching results. Their
timings exclude reading `resolvedOptions().locale`.
