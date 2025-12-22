# intl-numberformat Benchmark

This benchmark suite measures the performance of `@formatjs/intl-numberformat` against the native `Intl.NumberFormat` implementation.

## Background

This benchmark was created in response to [issue #5023](https://github.com/formatjs/formatjs/issues/5023), which reported ~10x performance degradation when formatting numbers repeatedly in React Native applications, particularly for date/time-related values (0-59 for minutes/seconds).

## Test Cases

The benchmark includes the following scenarios:

1. **Basic decimal formatting** - Most common use case
2. **Percent formatting** - Involves multiplication by 100
3. **Currency formatting** - USD currency formatting
4. **Unit formatting** - Unit style with long display
5. **Significant digits** - Uses `ToRawPrecision` (performance hotspot identified in issue)
6. **Fraction digits** - Uses `ToRawFixed`
7. **Time values 0-59** - Real-world scenario matching the reported issue
8. **formatToParts** - Heavier operation that returns structured parts

## Running the Benchmark

Using Bazel:

```bash
bazel run //packages/intl-numberformat/benchmark
```

Or using tsx directly from the root:

```bash
cd packages/intl-numberformat/benchmark
pnpm install
pnpm exec tsx benchmark.ts
```

## Interpreting Results

The benchmark uses [tinybench](https://github.com/tinylibs/tinybench) and outputs:

- Operations per second (ops/sec)
- Average time per operation
- Margin of error
- Comparison between polyfill and native implementations

Look for significant differences in the "time values 0-59" and "significantDigits" tests, as these relate to the performance issue reported.

## Benchmark Results

Results from running on macOS (Apple Silicon):

```
┌─────────┬────────────────────────────────────────────┬───────────────────┬────────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                                  │ Latency avg (ns)  │ Latency med (ns)   │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼────────────────────────────────────────────┼───────────────────┼────────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'format decimal (polyfill)'                │ '440270 ± 2.13%'  │ '397459 ± 7979.0'  │ '2398 ± 0.56%'         │ '2516 ± 51'            │ 2272    │
│ 1       │ 'format decimal (native)'                  │ '1758.7 ± 0.19%'  │ '1709.0 ± 41.00'   │ '580691 ± 0.02%'       │ '585138 ± 13709'       │ 568613  │
│ 2       │ 'format percent (polyfill)'                │ '400199 ± 1.18%'  │ '382625 ± 6292.0'  │ '2538 ± 0.33%'         │ '2614 ± 43'            │ 2499    │
│ 3       │ 'format percent (native)'                  │ '1956.7 ± 0.23%'  │ '1916.0 ± 41.00'   │ '520409 ± 0.02%'       │ '521921 ± 11413'       │ 511061  │
│ 4       │ 'format currency (polyfill)'               │ '406523 ± 0.38%'  │ '393270 ± 6437.5'  │ '2477 ± 0.29%'         │ '2543 ± 42'            │ 2460    │
│ 5       │ 'format currency (native)'                 │ '1955.3 ± 0.10%'  │ '1916.0 ± 41.00'   │ '520413 ± 0.02%'       │ '521921 ± 11413'       │ 511418  │
│ 6       │ 'format unit (polyfill)'                   │ '418859 ± 0.38%'  │ '404437 ± 5687.5'  │ '2404 ± 0.30%'         │ '2473 ± 35'            │ 2388    │
│ 7       │ 'format with significantDigits (polyfill)' │ '1179043 ± 0.45%' │ '1149500 ± 27875'  │ '852 ± 0.40%'          │ '870 ± 21'             │ 849     │
│ 8       │ 'format with fractionDigits (polyfill)'    │ '410403 ± 0.39%'  │ '396250 ± 6666.0'  │ '2455 ± 0.31%'         │ '2524 ± 43'            │ 2437    │
│ 9       │ 'format time values 0-59 (polyfill)'       │ '5024342 ± 0.38%' │ '5017354 ± 101291' │ '199 ± 0.37%'          │ '199 ± 4'              │ 200     │
│ 10      │ 'format time values 0-59 (native)'         │ '10885 ± 0.18%'   │ '10667 ± 250.00'   │ '92825 ± 0.05%'        │ '93747 ± 2147'         │ 91874   │
│ 11      │ 'formatToParts decimal (polyfill)'         │ '411749 ± 0.49%'  │ '396542 ± 6500.0'  │ '2452 ± 0.33%'         │ '2522 ± 41'            │ 2429    │
│ 12      │ 'formatToParts decimal (native)'           │ '5951.9 ± 0.23%'  │ '5792.0 ± 83.00'   │ '170772 ± 0.03%'       │ '172652 ± 2510'        │ 168013  │
└─────────┴────────────────────────────────────────────┴───────────────────┴────────────────────┴────────────────────────┴────────────────────────┴─────────┘
```

### Key Observations

1. **Native vs Polyfill Performance Gap:**
   - Basic decimal formatting: Native is **~242x faster** (580k ops/s vs 2.4k ops/s)
   - The polyfill takes ~440μs per format operation vs ~1.8μs for native

2. **Significant Digits Hotspot:**
   - Formatting with `significantDigits` is **~2.7x slower** than basic decimal formatting (852 ops/s vs 2,398 ops/s)
   - This confirms the `ToRawPrecision` function identified in issue #5023 as a performance bottleneck

3. **Time Values 0-59 (Issue #5023 Scenario):**
   - Polyfill: **199 ops/s** (~5ms per batch of 60 values)
   - Native: **92,825 ops/s** (~11μs per batch of 60 values)
   - Native is **~466x faster** for this real-world use case

4. **formatToParts Performance:**
   - Polyfill: 2,452 ops/s (~412μs per operation)
   - Native: 170,772 ops/s (~6μs per operation)
   - Native is **~70x faster**

These results confirm the significant performance gap reported in issue #5023, particularly for repeated formatting operations with small integer values (0-59) commonly used in date/time display.

## Related Files

- [`PartitionNumberPattern.ts`](../../ecma402-abstract/NumberFormat/PartitionNumberPattern.ts) - Main entry point
- [`ToRawPrecision.ts`](../../ecma402-abstract/NumberFormat/ToRawPrecision.ts) - Significant digits formatting (hotspot)
- [`FormatNumericToString.ts`](../../ecma402-abstract/NumberFormat/FormatNumericToString.ts) - Core formatting logic
- [`format_to_parts.ts`](../../ecma402-abstract/NumberFormat/format_to_parts.ts) - Part generation logic
