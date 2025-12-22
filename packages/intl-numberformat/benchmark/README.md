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

### After ToRawPrecision Optimization (Direct Calculation)

Results from running on macOS (Apple Silicon) after implementing direct calculation in `ToRawPrecision`:

```
┌─────────┬────────────────────────────────────────────┬───────────────────┬────────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                                  │ Latency avg (ns)  │ Latency med (ns)   │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼────────────────────────────────────────────┼───────────────────┼────────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'format decimal (polyfill)'                │ '392234 ± 0.61%'  │ '371791 ± 8666.5'  │ '2591 ± 0.42%'         │ '2690 ± 64'            │ 2550    │
│ 1       │ 'format decimal (native)'                  │ '1737.5 ± 0.30%'  │ '1667.0 ± 42.00'   │ '589316 ± 0.02%'       │ '599880 ± 15505'       │ 575545  │
│ 2       │ 'format percent (polyfill)'                │ '396033 ± 2.51%'  │ '356770 ± 8479.5'  │ '2668 ± 0.54%'         │ '2803 ± 68'            │ 2526    │
│ 3       │ 'format percent (native)'                  │ '1964.1 ± 0.27%'  │ '1917.0 ± 42.00'   │ '517270 ± 0.02%'       │ '521648 ± 11685'       │ 509139  │
│ 4       │ 'format currency (polyfill)'               │ '387081 ± 0.76%'  │ '366395 ± 8186.5'  │ '2636 ± 0.42%'         │ '2729 ± 62'            │ 2584    │
│ 5       │ 'format currency (native)'                 │ '1952.2 ± 0.53%'  │ '1875.0 ± 42.00'   │ '526284 ± 0.02%'       │ '533333 ± 11923'       │ 512251  │
│ 6       │ 'format unit (polyfill)'                   │ '395679 ± 0.47%'  │ '379896 ± 8729.0'  │ '2554 ± 0.35%'         │ '2632 ± 61'            │ 2528    │
│ 7       │ 'format with significantDigits (polyfill)' │ '1011253 ± 0.64%' │ '979416 ± 25082'   │ '996 ± 0.46%'          │ '1021 ± 26'            │ 989     │
│ 8       │ 'format with fractionDigits (polyfill)'    │ '387999 ± 0.44%'  │ '373625 ± 9917.0'  │ '2603 ± 0.34%'         │ '2676 ± 72'            │ 2578    │
│ 9       │ 'format time values 0-59 (polyfill)'       │ '4649196 ± 0.45%' │ '4629062 ± 103041' │ '215 ± 0.45%'          │ '216 ± 5'              │ 216     │
│ 10      │ 'format time values 0-59 (native)'         │ '10834 ± 0.10%'   │ '10625 ± 167.00'   │ '93180 ± 0.05%'        │ '94118 ± 1503'         │ 92304   │
│ 11      │ 'formatToParts decimal (polyfill)'         │ '387318 ± 0.54%'  │ '370125 ± 8042.0'  │ '2615 ± 0.37%'         │ '2702 ± 60'            │ 2583    │
│ 12      │ 'formatToParts decimal (native)'           │ '6030.9 ± 0.24%'  │ '5833.0 ± 125.00'  │ '169098 ± 0.04%'       │ '171438 ± 3597'        │ 165813  │
└─────────┴────────────────────────────────────────────┴───────────────────┴────────────────────┴────────────────────────┴────────────────────────┴─────────┘
```

### Performance Improvements

Comparing before/after the `ToRawPrecision` optimization:

| Benchmark                         | Before (ops/s) | After (ops/s) | Improvement |
| --------------------------------- | -------------- | ------------- | ----------- |
| **format with significantDigits** | 852            | 996           | **+17%** 🎉 |
| format decimal                    | 2,398          | 2,591         | +8%         |
| format time values 0-59           | 199            | 215           | +8%         |

The optimization replaced iterative `while(true)` loops with direct mathematical calculations using logarithms, reducing algorithmic complexity from O(n) to O(1) in the common case.

### Key Observations

1. **Native vs Polyfill Performance Gap:**
   - Basic decimal formatting: Native is **~227x faster** (589k ops/s vs 2.6k ops/s)
   - The polyfill takes ~392μs per format operation vs ~1.7μs for native

2. **Significant Digits Improvement:**
   - Formatting with `significantDigits` improved from 852 to **996 ops/s** (+17%)
   - Still **~2.6x slower** than basic decimal formatting, but the gap has narrowed
   - The direct calculation approach in `ToRawPrecision` eliminates most iteration overhead

3. **Time Values 0-59 (Issue #5023 Scenario):**
   - Polyfill: **215 ops/s** (~4.6ms per batch of 60 values)
   - Native: **93,180 ops/s** (~10.8μs per batch of 60 values)
   - Native is **~433x faster** for this real-world use case
   - The optimization provides modest improvement (+8%), but the gap remains significant

4. **formatToParts Performance:**
   - Polyfill: 2,615 ops/s (~387μs per operation)
   - Native: 169,098 ops/s (~6μs per operation)
   - Native is **~65x faster**

### Optimization Details

The `ToRawPrecision` function was optimized by:

1. **Replacing iterative search with direct calculation**: Using `floor(log10(x))` to compute the exponent directly instead of iterating
2. **Adding boundary adjustment logic**: Handles edge cases near powers of 10 efficiently
3. **Keeping fallback for safety**: Rare edge cases still use the original iterative approach

This change maintains full correctness while improving performance for the common path.

## Related Files

- [`PartitionNumberPattern.ts`](../../ecma402-abstract/NumberFormat/PartitionNumberPattern.ts) - Main entry point
- [`ToRawPrecision.ts`](../../ecma402-abstract/NumberFormat/ToRawPrecision.ts) - Significant digits formatting (hotspot)
- [`FormatNumericToString.ts`](../../ecma402-abstract/NumberFormat/FormatNumericToString.ts) - Core formatting logic
- [`format_to_parts.ts`](../../ecma402-abstract/NumberFormat/format_to_parts.ts) - Part generation logic
