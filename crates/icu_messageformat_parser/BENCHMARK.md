# ICU MessageFormat Parser Benchmark Results

This document contains benchmark results for the Rust implementation of the ICU MessageFormat parser.

## Running the Benchmarks

**IMPORTANT**: Always use `-c opt` to enable optimizations. Without it, benchmarks run in debug mode and are 6-8x slower.

```bash
# Build and run with optimizations (recommended)
bazel run -c opt //crates/icu_messageformat_parser:parser_bench -- --bench

# Alternative: Build first, then run
bazel build -c opt //crates/icu_messageformat_parser:parser_bench
./bazel-bin/crates/icu_messageformat_parser/parser_bench --bench
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
Date: 2026-05-25
Build mode: `-c opt` (optimized/release)

| Message Type | Avg Time | Throughput         | AST Size    |
| ------------ | -------- | ------------------ | ----------- |
| complex_msg  | 9.43 µs  | 106,067 ops/sec    | 3,911 bytes |
| normal_msg   | 1.18 µs  | 849,617 ops/sec    | 608 bytes   |
| simple_msg   | 153 ns   | 6,535,948 ops/sec  | 127 bytes   |
| string_msg   | 59 ns    | 16,949,153 ops/sec | 52 bytes    |

### Observations

- **Simple messages** (plain text and basic substitution) process at ~6.5M ops/sec
- **Plain string messages** without ICU syntax process at ~16.9M ops/sec
- **Normal messages** with number formatting and plurals process at ~850K ops/sec
- **Complex nested messages** with select/plural combinations process at ~106K ops/sec
- Performance scales roughly linearly with message complexity and AST size
- **Build mode matters**: Without `-c opt`, performance is 6-8x slower (fastbuild/debug mode)

### Recent Optimizations

**Optimization #4: Plain top-level message fast path** (2026-05-25):

- Short-circuits non-empty messages without ICU syntax into a single literal element
- Applies to the Rust parser when location capture is disabled
- Preserves TypeScript parser location data while scanning plain messages once
- Improves the checked-in `string_msg` benchmark from the previously documented 118 ns to 59 ns

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

| Message Type | JavaScript (V8)   | Rust (opt)             | Winner           |
| ------------ | ----------------- | ---------------------- | ---------------- |
| complex_msg  | 48,112 ops/sec    | **106,067 ops/sec**    | **Rust +120.5%** |
| normal_msg   | 337,642 ops/sec   | **849,617 ops/sec**    | **Rust +151.6%** |
| simple_msg   | 1,910,194 ops/sec | **6,535,948 ops/sec**  | **Rust +242.2%** |
| string_msg   | 7,461,955 ops/sec | **16,949,153 ops/sec** | **Rust +127.1%** |

**Key takeaways**:

- **Rust beats JavaScript on all 4 checked-in parser benchmarks by 120-242%**
- The optimizations eliminated string allocations and redundant character counting, which were the main bottlenecks
- Rust's ahead-of-time compilation combined with low-allocation parsing provides a consistent 2-3.5x performance advantage
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
