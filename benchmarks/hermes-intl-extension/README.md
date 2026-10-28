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

Pinned Hermes `393a539e6`, Linux x86_64, Intel Xeon Platinum 8488C:

| Operation                          | Native µs | TypeScript µs | Native speedup |
| ---------------------------------- | --------: | ------------: | -------------: |
| `getCanonicalLocales`              |      0.84 |          5.76 |          6.84x |
| `supportedValuesOf`                |      1.78 |          58.6 |          32.9x |
| `Locale.maximize`                  |      4.64 |          33.2 |          7.16x |
| `PluralRules.select`               |      1.39 |           139 |          99.9x |
| `ListFormat.format`                |      1.64 |          5.37 |          3.28x |
| `ListFormat.formatToParts`         |      6.25 |          7.13 |          1.14x |
| `DisplayNames.of`                  |      1.68 |          9.77 |          5.80x |
| `Segmenter.segment`                |      10.7 |          11.3 |          1.05x |
| `Collator.compare`                 |      1.66 |          4.59 |          2.76x |
| `NumberFormat.format`              |      3.71 |           388 |           104x |
| `RelativeTimeFormat.format`        |      2.64 |           456 |           173x |
| `RelativeTimeFormat.formatToParts` |      5.47 |           456 |          83.4x |
| `DateTimeFormat.format`            |      7.42 |         1,138 |           153x |
| `DurationFormat.format`            |      7.42 |         1,013 |           136x |

Ratios below 1 mean native is slower. These are one host's steady-state timings,
not startup or package-size results.

`supportedValuesOf` now reuses results while its formatter and locale data stay
unchanged. First call still probes candidates; later calls return fresh arrays.
The earlier 1,675 µs native result was before this cache.
`Locale.maximize` now transforms its Rust record directly. The earlier native
result was 10.9 µs.

`overlap.js` runs the APIs shared with
[magrinj/hermes-intl at 7cd12b6](https://github.com/magrinj/hermes-intl/tree/7cd12b68fb6f707192426065cec1dba4ced68d5a) on either Hermes
host. It uses `__now()` when available, otherwise `Date.now()`. On this host,
median of three runs: our `ListFormat.format` fell from 7.06 to 1.50 µs,
`formatToParts` from 9.84 to 4.80 µs, and `RelativeTimeFormat.format` from 3.92
to 2.53 µs. Magrinj measured 0.70, 4.55, and 1.01 µs respectively. Our bridge
keeps lone surrogates and reads array getters once; magrinj's shortcut
does neither.
