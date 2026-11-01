# NumberFormat benchmarks

Latest repository measurements: [shared suite](../../../benchmarks/polyfills/README.md).

Measured 2026-10-31 on Apple M4 Max, macOS arm64, Node 24.14.0 / ICU 78.2; source `56d15e997`. Median of seven warmed rounds.

| Operation                   | Polyfill ops/s | Full helpers ops/s | Native ops/s |
| --------------------------- | -------------: | -----------------: | -----------: |
| format decimal              |      1,599,170 |          1,587,734 |    3,831,639 |
| formatToParts               |      1,485,792 |          1,448,501 |      830,322 |
| formatRange                 |        585,925 |            584,530 |       63,138 |
| formatRangeToParts          |        621,251 |            627,891 |       55,439 |
| time values x60             |         79,629 |             80,705 |       98,065 |
| format currency             |      1,212,590 |          1,200,218 |    3,460,517 |
| format unit                 |        847,284 |            510,565 |    3,103,808 |
| format percent              |      1,484,939 |          1,473,882 |    3,439,826 |
| format scientific           |        821,324 |            831,359 |    3,729,988 |
| format compact              |        320,403 |            271,129 |    3,385,488 |
| format significant digits   |        728,792 |            760,763 |    3,430,845 |
| construct + resolvedOptions |        414,271 |            388,558 |      212,664 |

Polyfill uses host Intl helpers; Full helpers installs all FormatJS Intl APIs.
Construction includes `resolvedOptions()`. Setup and locale registration are
excluded. † marks round max/min > 1.5. See shared suite for inputs, variation, native controls, and raw data.

## Focused workloads

```sh
bazel run -c opt //packages/intl-numberformat/benchmark:benchmark
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- --all-locales
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- --all-locales --polyfill-plurals
bazel run -c opt //crates/intl_numberformat:benchmark
```

The audit varies supported-locale population, constructors, and numeric styles.
Historical optimization comparisons remain in [audit notes](../../../knowledge-base/audits/).

Current optimized Rust measurements: [shared report](../../../benchmarks/polyfills/README.md#existing-rust-suites).
