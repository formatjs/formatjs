# Hermes Intl extension benchmark

Build Hermes with the [FormatJS contrib package](../../native/hermes/package/contrib/README.md),
then build and run the benchmark bundle:

```sh
bazel build //benchmarks/hermes-intl-extension:suite_bundle
/path/to/hermes bazel-bin/benchmarks/hermes-intl-extension/suite_bundle.js
```

The bundle registers English locale data in the TypeScript constructors. All
12 APIs check matching output, calibrate to roughly 50 ms per round, then time
seven rounds. Native and TypeScript constructors run with their own Intl
dependencies in the same Hermes process. Results are median time per call.

Pinned Hermes `393a539e6`, Linux x86_64, Intel Xeon Platinum 8488C:

| Operation                   | Native µs | TypeScript µs | Native speedup |
| --------------------------- | --------: | ------------: | -------------: |
| `getCanonicalLocales`       |      0.83 |          4.44 |          5.35x |
| `supportedValuesOf`         |     1,650 |          58.6 |         0.036x |
| `Locale.maximize`           |      10.9 |          33.6 |          3.07x |
| `PluralRules.select`        |      1.27 |           123 |          97.2x |
| `ListFormat.format`         |      7.23 |          3.96 |          0.55x |
| `DisplayNames.of`           |      1.51 |          7.71 |          5.10x |
| `Segmenter.segment`         |      10.2 |          8.98 |          0.88x |
| `Collator.compare`          |      1.61 |          3.17 |          1.97x |
| `NumberFormat.format`       |      3.66 |           344 |          93.9x |
| `RelativeTimeFormat.format` |      3.91 |           400 |           102x |
| `DateTimeFormat.format`     |      7.42 |         1,000 |           135x |
| `DurationFormat.format`     |      7.03 |           888 |           126x |

Ratios below 1 mean native is slower. These are one host's steady-state timings,
not startup or package-size results.
