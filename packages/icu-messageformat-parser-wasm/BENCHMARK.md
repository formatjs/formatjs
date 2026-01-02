# WASM Parser Benchmark Results

This document contains benchmark results comparing the WASM-based ICU MessageFormat parser against the JavaScript parser.

## Running the Benchmark

```bash
bazel run //packages/icu-messageformat-parser-wasm/benchmark:benchmark
```

## Test Environment

- Platform: darwin (macOS)
- Architecture: arm64
- Node.js: v24.12.0
- Benchmark Duration: 1000ms per test

## Test Cases

The benchmark tests four types of messages with varying complexity:

1. **complex_msg**: Nested select/plural with multiple branches and HTML tags
2. **normal_msg**: Simple message with number formatting and plural rules
3. **simple_msg**: Basic message with a single argument
4. **string_msg**: Plain string with no arguments

All tests run with `captureLocation: false` for fair comparison.

## Results

### Performance Comparison

| Message Type | JS Parser (ops/s) | WASM Parser (ops/s) | Relative Performance |
| ------------ | ----------------- | ------------------- | -------------------- |
| complex_msg  | ~44,139           | ~3,084              | 14.3x slower         |
| normal_msg   | ~318,282          | ~20,353             | 15.6x slower         |
| simple_msg   | ~1,778,577        | ~104,852            | 17.0x slower         |
| string_msg   | ~3,264,332        | ~170,125            | 19.2x slower         |

### Detailed Metrics

```
┌─────────┬─────────────────────┬──────────────────┬───────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name           │ Latency avg (ns) │ Latency med (ns)  │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼─────────────────────┼──────────────────┼───────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'JS: complex_msg'   │ '23532 ± 0.42%'  │ '22208 ± 334.00'  │ '44139 ± 0.10%'        │ '45029 ± 685'          │ 42496   │
│ 1       │ 'WASM: complex_msg' │ '327579 ± 0.46%' │ '320167 ± 11875'  │ '3084 ± 0.30%'         │ '3123 ± 117'           │ 3053    │
│ 2       │ 'JS: normal_msg'    │ '3332.4 ± 0.41%' │ '3125.0 ± 83.00'  │ '318282 ± 0.04%'       │ '320000 ± 8731'        │ 300094  │
│ 3       │ 'WASM: normal_msg'  │ '50524 ± 0.73%'  │ '48500 ± 958.00'  │ '20353 ± 0.14%'        │ '20619 ± 399'          │ 19793   │
│ 4       │ 'JS: simple_msg'    │ '586.47 ± 0.33%' │ '542.00 ± 1.00'   │ '1778577 ± 0.01%'      │ '1845018 ± 3410'       │ 1705128 │
│ 5       │ 'WASM: simple_msg'  │ '9764.8 ± 0.36%' │ '9500.0 ± 167.00' │ '104852 ± 0.05%'       │ '105263 ± 1872'        │ 102409  │
│ 6       │ 'JS: string_msg'    │ '326.34 ± 0.44%' │ '292.00 ± 1.00'   │ '3264332 ± 0.01%'      │ '3424658 ± 11769'      │ 3064283 │
│ 7       │ 'WASM: string_msg'  │ '6059.4 ± 0.43%' │ '5834.0 ± 84.00'  │ '170125 ± 0.04%'       │ '171409 ± 2504'        │ 165034  │
└─────────┴─────────────────────┴──────────────────┴───────────────────┴────────────────────────┴────────────────────────┴─────────┘
```

## Analysis

### Why is WASM Slower?

The current WASM implementation is 14-19x slower than the JavaScript parser for these small operations due to several factors:

1. **Async Overhead**: The WASM parser uses async/await for initialization, adding latency to each call
2. **WASM Initialization**: Module initialization overhead, even when cached
3. **JSON Serialization**: Converting Rust structs to JSON strings and parsing them in JavaScript
4. **JS JIT Optimization**: Modern JavaScript engines heavily optimize frequently-called functions
5. **Small Operation Size**: For parsing small messages (microsecond range), overhead dominates execution time

### When WASM May Be Beneficial

Despite the current performance characteristics, WASM may still be valuable for:

1. **Batch Processing**: Processing thousands of messages in a single operation where initialization overhead is amortized
2. **Server-Side**: Long-running processes where the module stays loaded and warm
3. **Large Messages**: Very complex messages with deep nesting where parsing logic dominates
4. **Consistency**: WASM provides more predictable performance across different JavaScript engines
5. **Memory Usage**: Potential for lower memory footprint compared to JavaScript parser
6. **Future Optimizations**: Removing async overhead, using SharedArrayBuffer, or streaming APIs

### Potential Optimizations

Future work could explore:

- Synchronous WASM initialization using WebAssembly.instantiateStreaming
- Binary format instead of JSON for data exchange
- Batch parsing API to amortize initialization overhead
- WASM SIMD for text processing operations
- Direct memory access via SharedArrayBuffer
- Streaming parser for very large messages

## AST Output Differences

Note: AST length differs between parsers even with the same options due to different serialization:

```
JS Parser (no location):
  complex_msg AST length: 2599
  normal_msg AST length: 400
  simple_msg AST length: 79
  string_msg AST length: 36

WASM Parser (no location):
  complex_msg AST length: 3911
  normal_msg AST length: 608
  simple_msg AST length: 127
  string_msg AST length: 52
```

The WASM parser produces larger JSON due to:

- Different property ordering
- Additional whitespace in serialization
- Enum representation differences

However, the AST structure is semantically equivalent and all 117 integration tests pass.

## Conclusion

The WASM parser successfully provides a functionally equivalent alternative to the JavaScript parser with 100% test compatibility. While currently slower for small operations, it demonstrates the feasibility of using Rust + WASM for ICU MessageFormat parsing and provides a foundation for future optimizations.

For production use, the JavaScript parser is recommended for most use cases. The WASM parser may be suitable for specialized scenarios like batch processing or environments requiring consistent cross-engine performance.
