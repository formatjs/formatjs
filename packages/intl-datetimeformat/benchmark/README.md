# DateTimeFormat benchmark

```sh
bazel run -c opt //packages/intl-datetimeformat/benchmark:audit -- --iterations=6000
bazel run -c opt //packages/intl-datetimeformat/benchmark:audit -- --polyfill-numbers --iterations=6000
bazel run -c opt //crates/intl_datetimeformat:audit -- --benchmark --iterations=12000
```

Five profiles exercise strings, parts, ranges and range parts. Each row warms
1,000 calls, then reports seven rounds' median/min/max in microseconds per call.
English data and timezone transitions load before timing. Registration timings
include different work across engines; do not compare them.

[Recorded results](./results.json): macOS arm64, Node 24.14.0, optimized Rust,
baseline `025a5cabcfe871a17b2cad4ec1b76e28e27e928e`. Before/after checksums match
for all 60 rows. Numeric providers differ across TS modes; compare each mode with
its own baseline.

| Operation                               | Before, µs | After, µs | Speedup |
| --------------------------------------- | ---------: | --------: | ------: |
| TS host numbers, date                   |      2.777 |     1.797 |   1.54× |
| TS host numbers, fractional seconds     |      3.495 |     2.044 |   1.71× |
| TS polyfill numbers, date               |      5.057 |     4.029 |   1.26× |
| TS polyfill numbers, fractional seconds |      6.131 |     4.602 |   1.33× |
| Rust, date                              |      1.343 |     1.149 |   1.17× |
| Rust, date range                        |      1.752 |     1.405 |   1.25× |

Other ranges improve less. Small differences near 2–5% need more samples before
claiming a win. These measurements cover rendering, not construction or data
registration. A baseline Node CPU profile attributes about 14% of samples to
repeated numeric memoizer serialization and 4% to pattern partitioning.

To collect another profile:

```sh
bazel run -c opt //packages/intl-datetimeformat/benchmark:audit -- --node_options=--cpu-prof --node_options=--cpu-prof-dir=/tmp --iterations=12000
```
