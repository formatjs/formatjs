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

### Benchmark Suite

Using Bazel:

```bash
bazel run //packages/intl-numberformat/benchmark:benchmark
```

Or using tsx directly from the root:

```bash
cd packages/intl-numberformat/benchmark
pnpm install
pnpm exec tsx benchmark.ts
```

### CPU Profiling

For detailed performance analysis and CPU profiling workflows, see **[PROFILE.md](./PROFILE.md)**.

## Interpreting Results

The benchmark uses [tinybench](https://github.com/tinylibs/tinybench) and outputs:

- Operations per second (ops/sec)
- Average time per operation
- Margin of error
- Comparison between polyfill and native implementations

Look for significant differences in the "time values 0-59" and "significantDigits" tests, as these relate to the performance issue reported.

## Benchmark Results

### After Fast-Path Logarithm Optimization

Results from running on macOS (Apple Silicon) with Node.js v24.11.1:

```
┌─────────┬────────────────────────────────────────────┬──────────────────┬───────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                                  │ Latency avg (ns) │ Latency med (ns)  │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼────────────────────────────────────────────┼──────────────────┼───────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'format decimal (polyfill)'                │ '35333 ± 0.36%'  │ '34000 ± 500.00'  │ '28938 ± 0.10%'        │ '29412 ± 439'          │ 28303   │
│ 1       │ 'format decimal (native)'                  │ '1727.4 ± 0.19%' │ '1708.0 ± 42.00'  │ '589508 ± 0.02%'       │ '585480 ± 14400'       │ 578900  │
│ 2       │ 'format percent (polyfill)'                │ '34461 ± 1.42%'  │ '32583 ± 333.00'  │ '30107 ± 0.10%'        │ '30691 ± 317'          │ 29020   │
│ 3       │ 'format percent (native)'                  │ '1928.2 ± 0.11%' │ '1916.0 ± 41.00'  │ '522869 ± 0.01%'       │ '521921 ± 11413'       │ 518628  │
│ 4       │ 'format currency (polyfill)'               │ '35661 ± 0.27%'  │ '34625 ± 375.00'  │ '28467 ± 0.09%'        │ '28881 ± 316'          │ 28043   │
│ 5       │ 'format currency (native)'                 │ '1924.6 ± 0.13%' │ '1916.0 ± 41.00'  │ '524039 ± 0.02%'       │ '521921 ± 11413'       │ 519580  │
│ 6       │ 'format unit (polyfill)'                   │ '40681 ± 0.37%'  │ '39167 ± 459.00'  │ '25083 ± 0.10%'        │ '25532 ± 303'          │ 24582   │
│ 7       │ 'format with significantDigits (polyfill)' │ '649578 ± 0.36%' │ '632312 ± 6437.0' │ '1546 ± 0.30%'         │ '1581 ± 16'            │ 1540    │
│ 8       │ 'format with fractionDigits (polyfill)'    │ '35427 ± 0.31%'  │ '34333 ± 542.00'  │ '28760 ± 0.09%'        │ '29126 ± 467'          │ 28227   │
│ 9       │ 'format time values 0-59 (polyfill)'       │ '227776 ± 0.37%' │ '220458 ± 4167.0' │ '4436 ± 0.25%'         │ '4536 ± 86'            │ 4391    │
│ 10      │ 'format time values 0-59 (native)'         │ '10743 ± 0.14%'  │ '10584 ± 168.00'  │ '93984 ± 0.04%'        │ '94482 ± 1524'         │ 93084   │
│ 11      │ 'formatToParts decimal (polyfill)'         │ '36420 ± 0.62%'  │ '34500 ± 625.00'  │ '28434 ± 0.12%'        │ '28986 ± 516'          │ 27458   │
│ 12      │ 'formatToParts decimal (native)'           │ '5870.1 ± 0.23%' │ '5750.0 ± 83.00'  │ '172230 ± 0.03%'       │ '173913 ± 2475'        │ 170356  │
└─────────┴────────────────────────────────────────────┴──────────────────┴───────────────────┴────────────────────────┴────────────────────────┴─────────┘
```

### Performance Improvements

Comparing before/after the fast-path logarithm optimization:

| Benchmark                     | Before (ops/s) | After (ops/s) | Improvement  |
| ----------------------------- | -------------- | ------------- | ------------ |
| **format decimal**            | 2,591          | **28,938**    | **11.2x** 🚀 |
| **format time values 0-59**   | 215            | **4,436**     | **20.6x** 🚀 |
| **formatToParts**             | 2,615          | **28,434**    | **10.9x** 🚀 |
| format percent                | 2,668          | 30,107        | 11.3x        |
| format currency               | 2,636          | 28,467        | 10.8x        |
| format with fractionDigits    | 2,603          | 28,760        | 11.0x        |
| format unit                   | 2,554          | 25,083        | 9.8x         |
| format with significantDigits | 996            | 1,546         | 1.6x         |

**Overall speedup: 10-20x faster for most common operations!**

### Key Observations

1. **Dramatic Performance Improvement:**
   - Basic decimal formatting: **11.2x faster** (~35μs vs ~386μs per operation)
   - Time values 0-59 (issue #5023): **20.6x faster** (~228μs vs ~4.7ms per batch)
   - formatToParts: **10.9x faster** (~36μs vs ~382μs per operation)

2. **Native vs Polyfill Gap (After Optimization):**
   - Basic decimal: Native is ~20x faster (was ~227x)
   - Time values 0-59: Native is ~21x faster (was ~433x)
   - formatToParts: Native is ~6x faster (was ~65x)
   - **The gap has been significantly reduced!**

3. **CPU Time Reduction:**
   - Decimal.js operations: Reduced from 270K hits to 21K hits (**92% reduction**)
   - Logarithm operations: Eliminated from hot path for common integers (0-999,999)

4. **Significant Digits Path:**
   - Still slower (1,546 ops/s) due to complex precision calculations
   - Improved by 1.6x from previous optimization
   - Remains the slowest path but acceptable for specialized use cases

### Optimization Details

The optimization uses a **hybrid fast/slow path approach**:

1. **Fast path for simple integers (0-999,999)**:
   - Uses native `Math.log10()` instead of Decimal.js logarithms
   - Orders of magnitude faster for common values
   - Applies to dates, times, counters, and most UI numbers

2. **Power-of-10 caching**:
   - Caches `Decimal.pow(10, n)` results to avoid repeated calculations
   - Reduces overhead in `ComputeExponent` and `ToRawFixed`

3. **Maintains correctness**:
   - Falls back to Decimal.js for complex cases (very large numbers, decimals, BigInt)
   - All 50+ unit tests pass
   - No breaking changes

This change provides massive performance improvements for the common path while maintaining full correctness.

## Related Files

- [`PartitionNumberPattern.ts`](../../ecma402-abstract/NumberFormat/PartitionNumberPattern.ts) - Main entry point
- [`ToRawPrecision.ts`](../../ecma402-abstract/NumberFormat/ToRawPrecision.ts) - Significant digits formatting (hotspot)
- [`FormatNumericToString.ts`](../../ecma402-abstract/NumberFormat/FormatNumericToString.ts) - Core formatting logic
- [`format_to_parts.ts`](../../ecma402-abstract/NumberFormat/format_to_parts.ts) - Part generation logic
