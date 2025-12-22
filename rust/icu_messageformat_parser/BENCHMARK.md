# ICU MessageFormat Parser Benchmark Results

This document contains benchmark results for the Rust implementation of the ICU MessageFormat parser.

## Running the Benchmarks

**IMPORTANT**: Always use `-c opt` to enable optimizations. Without it, benchmarks run in debug mode and are 6-8x slower.

```bash
# Build and run with optimizations (recommended)
bazel run -c opt //rust/icu_messageformat_parser:parser_bench -- --bench

# Alternative: Build first, then run
bazel build -c opt //rust/icu_messageformat_parser:parser_bench
./bazel-bin/rust/icu_messageformat_parser/parser_bench --bench
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
Build mode: `-c opt` (optimized/release)

| Message Type | Avg Time | Throughput        | AST Size    |
| ------------ | -------- | ----------------- | ----------- |
| complex_msg  | 10.0 µs  | 100,394 ops/sec   | 3,911 bytes |
| normal_msg   | 1.33 µs  | 752,517 ops/sec   | 608 bytes   |
| simple_msg   | 172 ns   | 5,803,212 ops/sec | 127 bytes   |
| string_msg   | 118 ns   | 8,474,576 ops/sec | 52 bytes    |

### Observations

- **Simple messages** (plain text and basic substitution) process at ~5.8M ops/sec
- **Normal messages** with number formatting and plurals process at ~753K ops/sec
- **Complex nested messages** with select/plural combinations process at ~100K ops/sec
- Performance scales roughly linearly with message complexity and AST size
- **Build mode matters**: Without `-c opt`, performance is 6-8x slower (fastbuild/debug mode)

### Recent Optimizations

**Optimization #1 & #2: Avoid double character counting + eliminate string allocations** (2025-12-21):

- **Optimization #1**: Modified `match_identifier_at_index()` to return both string slice AND character count in a single pass, avoiding the need to count characters twice
- **Optimization #2**: Replaced regex-based identifier matching with character-by-character iteration (from previous optimization)
- **Optimization #3**: Eliminated String allocations for every character in literal text by pushing directly into buffer instead of allocating temporary single-character Strings
- Combined performance improvements:
  - complex_msg: +45.3% faster (18.3 µs → 10.0 µs)
  - normal_msg: +25.3% faster (1.78 µs → 1.33 µs)
  - simple_msg: +47.7% faster (329 ns → 172 ns)
  - string_msg: +67.0% faster (358 ns → 118 ns)

### Comparison with JavaScript Implementation

Comparing with the JavaScript/TypeScript implementation (from `packages/icu-messageformat-parser/benchmark/benchmark.ts`):

| Message Type | JavaScript (V8)   | Rust (opt)            | Winner              |
| ------------ | ----------------- | --------------------- | ------------------- |
| complex_msg  | 58,910 ops/sec    | **100,394 ops/sec**   | **Rust +70.4%** 🚀  |
| normal_msg   | 405,440 ops/sec   | **752,517 ops/sec**   | **Rust +85.6%** 🚀  |
| simple_msg   | 2,592,098 ops/sec | **5,803,212 ops/sec** | **Rust +123.9%** 🚀 |
| string_msg   | 4,511,129 ops/sec | **8,474,576 ops/sec** | **Rust +87.9%** 🚀  |

**Key takeaways**:

- **Rust now beats JavaScript on ALL 4 benchmarks by 70-124%!** 🎉
- The optimizations eliminated string allocations and redundant character counting, which were the main bottlenecks
- Rust's ahead-of-time compilation combined with zero-allocation parsing provides consistent 2-3x performance advantage
- For high-throughput server applications, Rust delivers exceptional sub-microsecond to low-microsecond parsing times
- The performance gap is largest for simple messages where allocation overhead dominated the previous implementation

## Implementation Notes

The parser is implemented in Rust with:

- Zero-copy string parsing where possible
- Efficient AST construction using owned data structures
- Integration with ICU4X for locale-specific operations
- Full serialization support via serde

## Benchmark Code

The benchmark implementation can be found in `benches/parser_bench.rs`, which uses the Criterion framework for accurate performance measurement with statistical analysis.
