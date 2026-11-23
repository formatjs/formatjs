# Temporal benchmarks

Benchmarks cover the published TypeScript package, native Rust, and Hermes.
See the [implementation guide](../../knowledge-base/015-temporal.md) for
conformance and data-provider limits.

## Run benchmarks

Run targets with `bazel run -c opt <target>`. Run timing profiles separately
on the same idle host, with matching inputs and iteration counts.

| Target                                           | Measures                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `//benchmarks/temporal:comparison_benchmark`     | 48 public workloads against both JavaScript reference polyfills       |
| `//benchmarks/temporal:native_ts_benchmark`      | Matched native Rust and TypeScript workloads, including named zones   |
| `//benchmarks/temporal/rust:native_benchmark`    | Native Rust against `temporal_rs`, plus FormatJS named-zone workloads |
| `//benchmarks/temporal:startup_benchmark`        | Fresh-process import and first operation                              |
| `//benchmarks/temporal:hermes_instant_benchmark` | Hermes source and optimized bytecode, including the installed SDK     |
| `//benchmarks/temporal:legacy_date_benchmark`    | Ordinary Date formatting before and after Temporal installation       |
| `//benchmarks/temporal:locale_benchmark`         | Locale methods with FormatJS and host Intl                            |
| `//benchmarks/temporal:size_benchmark`           | Bundled sizes and published module graphs                             |
| `//benchmarks/temporal:host_data_size_benchmark` | Size with host data or bundled tables                                 |

For a fresh process per JavaScript implementation, run:

```sh
for profile in typescript reference officialReference; do
  FORMATJS_TEMPORAL_BENCHMARK_PROFILE="$profile" \
  FORMATJS_TEMPORAL_BENCHMARK_CALLSITE=isolated \
  bazel run -c opt //benchmarks/temporal:comparison_benchmark
done
```

Use `FORMATJS_TEMPORAL_NATIVE_PROFILE=named` with `native_ts_benchmark`
for named zones only. The default runs all groups.

## JavaScript results

In the [performance snapshot](https://github.com/formatjs/formatjs/commit/2b69653fbaa19baae626aa1e05ea8bcc8b94718b),
TypeScript had the lowest median on all **48** workloads in both isolated
Node.js 24.14.0 rounds on an Intel Xeon Platinum 8488C. Each case used eight
inputs and checked output parity before timing. The reference builds were
`temporal-polyfill` 1.0.7 basic and `@js-temporal/polyfill` 0.5.1.

| Implementation          | Import + first operation median | Minified consumer, gzip |
| ----------------------- | ------------------------------: | ----------------------: |
| FormatJS TypeScript     |                        26.50 ms |            51,669 bytes |
| `temporal-polyfill`     |                        34.11 ms |            19,367 bytes |
| `@js-temporal/polyfill` |                        32.22 ms |            47,066 bytes |

The startup run used nine fresh processes per implementation with persistent
compile caches disabled and a warm filesystem. It measured import, first
Instant parse, and New York date projection, excluding process launch and
global installation. Both references finished the first operation faster in
isolation. All three used host Intl time-zone data. Bundle sizes measure
namespace consumers minified for ES2022 and compressed with gzip level 9.

Report shared and isolated call sites separately. Filtered runs change JIT
feedback, and profiling changes timing. Keep ISO/Gregorian comparisons separate
from full-calendar runs.

## Native Rust and Hermes results

- **Rust vs. TypeScript.** The recorded native checkpoint won all 37 matched
  medians and means in six fresh runs. The 25 core workloads and 12 named-zone
  workloads are reported separately. Native timings exclude JavaScript binding
  costs. [Raw controls](day-start-experiments.json)
- **Rust vs. `temporal_rs`.** The pinned 0.2.6 comparison covers 25 UTC and
  fixed-offset workloads. It preinitializes registries and consumes equivalent
  outputs. Upstream won 22/25 medians at this earlier checkpoint.
  [Native results](temporal-rs-native-results.json)
- **Hermes.** Against the basic JS reference, TypeScript won 28/43 source and
  29/43 bytecode medians in the performance snapshot. The Rust bridge won
  32/43 and 22/43, and the installed SDK won 34/43 and 21/43. These runs used
  FormatJS DateTimeFormat with English locale and owned IANA data. Hermes
  timings include the runtime path and any binding costs.

## Diagnostics

- [Legacy Date results](legacy-date-results.json) separate formatters created
  before and after installation. In the recorded Node run, existing formatters
  stayed within 3% of native and new Gregorian formatters took 5.1–6.3 times as
  long for `format`. Timings exclude installation and construction.
- [Locale results](locale-results.json) compare owned English FormatJS formatters
  with host Intl. The reference bundle excludes the host's Intl implementation
  and data.
- [Size audit](size-audit-results.json) uses
  `//benchmarks/temporal:size_audit` to reproduce a recorded payload breakdown.
  It checks checkpoint sizes and disables features to estimate their cost.
  Time-zone metadata and locale formatting account for about 6.3 KB and 5.8 KB
  gzip at that checkpoint. Savings overlap. Use `size_benchmark` for current
  package sizes.
- [Native Gregorian lookup controls](rule-classification-experiments.json) use
  `//benchmarks/temporal/rust:lookup_benchmark`. Pass `-- --first 0` for
  first-call timing, which excludes launch time.

For lower-level probes, use `//benchmarks/temporal:benchmark` or
`//benchmarks/temporal:facade_benchmark`. To check two emitted JavaScript
bundles for equivalent structure after normalizing local names, run:

```sh
bazel run -c opt //benchmarks/temporal:ts_regression_guard -- /tmp/baseline.js /tmp/current.js
```
