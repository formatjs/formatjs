# DurationFormat benchmarks

Latest repository measurements: [shared suite](../../../benchmarks/polyfills/README.md).

Measured 2026-10-31 on Apple M4 Max, macOS arm64, Node 24.14.0 / ICU 78.2; source `56d15e997`. Median of seven warmed rounds.

| Operation                   | Polyfill ops/s | Full helpers ops/s | Native ops/s |
| --------------------------- | -------------: | -----------------: | -----------: |
| format long                 |         89,664 |             89,675 |       31,950 |
| formatToParts long          |         91,340 |             89,470 |       29,683 |
| format digital              |        132,696 |            176,617 |       77,434 |
| formatToParts digital       |        134,372 |            172,715 |       65,289 |
| construct + resolvedOptions |        184,968 |            175,152 |       33,707 |

Polyfill uses host Intl helpers; Full helpers installs all FormatJS Intl APIs.
Construction includes `resolvedOptions()`. Setup and locale registration are
excluded. † marks round max/min > 1.5. See shared suite for inputs, variation, native controls, and raw data.

## Focused workloads

```sh
bazel run -c opt //packages/intl-durationformat/benchmark:benchmark
bazel run -c opt //packages/intl-durationformat/benchmark:instantiation_benchmark
bazel run -c opt //packages/intl-durationformat/benchmark:profile_cpu
```
