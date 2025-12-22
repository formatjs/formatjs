# ICU MessageFormat Parser Benchmark Results

This document contains benchmark results for the Rust implementation of the ICU MessageFormat parser.

## Running the Benchmarks

```bash
# Build the benchmark
bazel build //rust/icu_messageformat_parser:parser_bench

# Run with output
./bazel-bin/rust/icu_messageformat_parser/parser_bench --bench
```

Alternatively, you can run via bazel (but output will be suppressed):

```bash
bazel run //rust/icu_messageformat_parser:parser_bench
```

The benchmark uses [Criterion.rs](https://github.com/bheisler/criterion.rs) for statistical analysis of performance.

## Test Messages

The benchmarks test parsing performance on four different message complexities:

1. **complex_msg**: Nested select and plural with multiple conditions and HTML tags (3911 bytes AST)
2. **normal_msg**: Mixed argument types with number formatting and plurals (608 bytes AST)
3. **simple_msg**: Basic variable substitution (127 bytes AST)
4. **string_msg**: Plain text with no ICU syntax (52 bytes AST)

## Results

Benchmark run on: Apple Silicon (M-series)
Date: 2025-12-21

| Message Type | Avg Time  | Throughput      | AST Size    |
| ------------ | --------- | --------------- | ----------- |
| complex_msg  | 127.17 µs | 7,863 ops/sec   | 3,911 bytes |
| normal_msg   | 16.89 µs  | 59,206 ops/sec  | 608 bytes   |
| simple_msg   | 2.35 µs   | 425,532 ops/sec | 127 bytes   |
| string_msg   | 1.74 µs   | 574,713 ops/sec | 52 bytes    |

### Observations

- **Simple messages** (plain text and basic substitution) are extremely fast, processing over 425K messages per second
- **Normal messages** with number formatting and plurals process at ~59K ops/sec
- **Complex nested messages** with select/plural combinations process at ~7.9K ops/sec
- Performance scales roughly linearly with message complexity and AST size

### Comparison with JavaScript Implementation

The JavaScript implementation benchmarks (from `packages/icu-messageformat-parser/benchmark.js`) show:

- Node.js typically runs these benchmarks at different speeds due to V8 JIT optimization
- The Rust implementation provides more predictable performance characteristics
- For high-throughput server applications, the Rust parser offers consistent sub-microsecond to low-microsecond parsing times

## Implementation Notes

The parser is implemented in Rust with:

- Zero-copy string parsing where possible
- Efficient AST construction using owned data structures
- Integration with ICU4X for locale-specific operations
- Full serialization support via serde

## Benchmark Code

The benchmark implementation can be found in `benches/parser_bench.rs`, which uses the Criterion framework for accurate performance measurement with statistical analysis.
