# intl-durationformat Benchmark

This benchmark suite measures the performance of `@formatjs/intl-durationformat` against the native `Intl.DurationFormat` implementation (when available).

## Background

DurationFormat is used to format time durations in a locale-sensitive manner. Common use cases include:

- Video/media player durations (e.g., "2:15:42" or "2 hr 15 min")
- Elapsed time displays
- Countdown timers
- Task duration tracking

This benchmark helps ensure the polyfill performs efficiently for real-world applications.

## Test Cases

The benchmark includes the following scenarios:

1. **Short style formatting** - Most common use case (e.g., "1 hr 30 min")
2. **Long style formatting** - Verbose format (e.g., "1 hour, 30 minutes")
3. **Narrow style formatting** - Compact format (e.g., "1h 30m")
4. **Digital style formatting** - Time-like format (e.g., "1:30:00")
5. **formatToParts** - Heavier operation that returns structured parts
6. **Video durations** - Real-world scenario for media applications
7. **Sub-second precision** - Milliseconds formatting

## Running the Benchmark

### Formatting Performance Benchmark

Using Bazel:

```bash
bazel run //packages/intl-durationformat/benchmark:benchmark
```

Or using tsx directly from the root:

```bash
cd packages/intl-durationformat/benchmark
pnpm install
pnpm exec tsx benchmark.ts
```

### Instantiation Performance Benchmark

To measure DurationFormat constructor performance (relevant to issue #4936):

```bash
bazel run //packages/intl-durationformat/benchmark:instantiation_benchmark
```

### CPU Profiling

For detailed performance analysis and CPU profiling workflows, see **[PROFILE.md](./PROFILE.md)**.

## Interpreting Results

The benchmark uses [tinybench](https://github.com/tinylibs/tinybench) and outputs:

- Operations per second (ops/sec)
- Average time per operation
- Margin of error
- Comparison between polyfill and native implementations (when available)

Look for performance patterns across different styles and use cases to identify optimization opportunities.

## Benchmark Results

### Initial Baseline

Results from running on macOS (Apple Silicon) with Node.js v24.11.1:

```
┌─────────┬────────────────────────────────────────┬──────────────────┬──────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                              │ Latency avg (ns) │ Latency med (ns) │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼────────────────────────────────────────┼──────────────────┼──────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'format short style (polyfill)'        │ '86402 ± 0.18%'  │ '85583 ± 2834.0' │ '11659 ± 0.14%'        │ '11685 ± 380'          │ 11574   │
│ 1       │ 'format long style (polyfill)'         │ '88259 ± 0.19%'  │ '87750 ± 3083.0' │ '11422 ± 0.15%'        │ '11396 ± 392'          │ 11331   │
│ 2       │ 'format narrow style (polyfill)'       │ '83044 ± 0.20%'  │ '82541 ± 1542.0' │ '12128 ± 0.13%'        │ '12115 ± 224'          │ 12042   │
│ 3       │ 'format digital style (polyfill)'      │ '92334 ± 0.21%'  │ '91958 ± 3583.0' │ '10918 ± 0.15%'        │ '10875 ± 420'          │ 10831   │
│ 4       │ 'formatToParts short style (polyfill)' │ '85850 ± 0.20%'  │ '85958 ± 2875.0' │ '11741 ± 0.14%'        │ '11634 ± 391'          │ 11649   │
│ 5       │ 'format video durations (polyfill)'    │ '29617 ± 0.18%'  │ '29625 ± 750.00' │ '34157 ± 0.09%'        │ '33755 ± 877'          │ 33765   │
│ 6       │ 'format with milliseconds (polyfill)'  │ '14021 ± 0.24%'  │ '13958 ± 375.00' │ '72604 ± 0.06%'        │ '71644 ± 1874'         │ 71320   │
└─────────┴────────────────────────────────────────┴──────────────────┴──────────────────┴────────────────────────┴────────────────────────┴─────────┘
```

**Note:** Native `Intl.DurationFormat` is not yet widely available in browsers/runtimes, so most comparisons will be polyfill-only until native support becomes more common.

### Performance Summary

| Benchmark                 | Latency (μs) | Throughput (ops/s) | Notes                               |
| ------------------------- | ------------ | ------------------ | ----------------------------------- |
| Short style               | ~86          | ~11,659            | Default style, most common          |
| Long style                | ~88          | ~11,422            | Verbose format with full unit names |
| Narrow style              | ~83          | ~12,128            | Most compact, slightly faster       |
| Digital style             | ~92          | ~10,918            | Time-like format (1:30:00)          |
| formatToParts             | ~86          | ~11,741            | Similar to format() performance     |
| Video durations (digital) | ~30          | ~34,157            | Real-world scenario, 3x faster      |
| Milliseconds formatting   | ~14          | ~72,604            | Sub-second precision, very fast     |

### Key Observations

1. **Style Performance:**
   - Digital style is commonly used for video players and should be optimized
   - Short style is the default and most frequently used
   - Long/narrow styles are less performance-critical

2. **Real-World Use Cases:**
   - Video duration formatting (digital style) is a hot path
   - Sub-second precision may require additional calculations
   - Most durations are simple (hours/minutes/seconds combinations)

3. **Optimization Opportunities:**
   - Cache formatted number strings for common values (0-59 for minutes/seconds)
   - Fast path for digital format with simple durations
   - Avoid unnecessary calculations for zero values

## Optimization Details

Potential optimization strategies:

1. **Number Format Caching**:
   - Cache `Intl.NumberFormat` instances per locale/options
   - Reuse number formatters across format calls
   - Pre-format common values (0-59 for time units)

2. **Fast Paths**:
   - Special handling for digital format (most common for video)
   - Skip processing for zero-valued units
   - Optimize for common patterns (hours:minutes:seconds)

3. **Lazy Evaluation**:
   - Only compute display options for non-zero units
   - Defer expensive operations until needed

## Related Files

- [`core.ts`](../src/core.ts) - Main DurationFormat implementation
- [`PartitionDurationFormatPattern.ts`](../src/abstract/PartitionDurationFormatPattern.ts) - Core formatting logic
- [`ToDurationRecord.ts`](../src/abstract/ToDurationRecord.ts) - Duration input validation
- [`GetDurationUnitOptions.ts`](../src/abstract/GetDurationUnitOptions.ts) - Unit options resolution

## Contributing

When optimizing DurationFormat:

1. Run benchmarks before and after changes
2. Ensure all unit tests pass
3. Document performance improvements in this file
4. Consider edge cases (negative durations, fractional values, etc.)
5. Profile to identify actual bottlenecks before optimizing
