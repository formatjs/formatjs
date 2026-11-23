# ICU MessageFormat Parser (Rust)

A Rust implementation of the ICU MessageFormat parser.

## Features

- Full ICU MessageFormat syntax support
- High-performance parsing - **2.3-3.5x faster than JavaScript parser** on the checked-in benchmark
- Zero-copy parsing where possible
- Comprehensive error handling

## Performance

The Rust parser (optimized build) significantly outperforms both the JavaScript parser and other Rust implementations:

```bash
$ bazel run -c opt //crates/icu_messageformat_parser:parser_bench -- --bench --output-format bencher
```

| Message Type | Rust Parser | JavaScript | Speedup vs JS    | SWC Parser | vs SWC       |
| ------------ | ----------- | ---------- | ---------------- | ---------- | ------------ |
| complex_msg  | 9.43 µs     | 21.39 µs   | **2.27x faster** | 10.3 µs    | 1.09x faster |
| normal_msg   | 1.18 µs     | 3.10 µs    | **2.63x faster** | 1.25 µs    | 1.06x faster |
| simple_msg   | 153 ns      | 543 ns     | **3.55x faster** | 184 ns     | 1.20x faster |
| string_msg   | 59 ns       | 146 ns     | **2.47x faster** | 126 ns     | 2.14x faster |

**Note:** Always use `-c opt` for benchmarking to enable release optimizations.

## Project Structure

- `lib.rs` - Main library
- `parser.rs` - Core parser implementation
- `types.rs` - AST types
- `error.rs` - Error types
- `date_time_pattern_generator.rs` - Date/time pattern support
- `manipulator.rs` - AST manipulation utilities
- `printer.rs` - AST printing utilities

## Building

### Native Rust Library

```bash
# Run tests
bazel test //crates/icu_messageformat_parser:icu_messageformat_parser_test

# Build library
bazel build //crates/icu_messageformat_parser:icu_messageformat_parser

# Run benchmarks
bazel run -c opt //crates/icu_messageformat_parser:parser_bench
```

### WebAssembly

This crate currently exposes a native Rust library. Its BUILD file and Cargo
manifest do not define a WASM target, `wasm` feature, or wasm-bindgen bindings.

For the repository's working `rules_rs` WASM build, see
[Temporal](../temporal/README.md) and its [platform transition](../temporal/wasm.bzl).

## Dependencies

- `icu` - Unicode/ICU functionality
- `regex` - Pattern matching
- `serde` - Serialization framework
- `once_cell` - Lazy static initialization

## Development

### Regenerate Generated Files

```bash
# Regenerate time data
bazel run //crates/icu_messageformat_parser:time-data

# Regenerate regex patterns
bazel run //crates/icu_messageformat_parser:regex
```

### Testing

```bash
# Run Rust tests
bazel test //crates/icu_messageformat_parser:icu_messageformat_parser_test

# Run benchmarks
bazel run //crates/icu_messageformat_parser:parser_bench
```

## References

- [ICU MessageFormat Syntax](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [Bazel Platform Transitions](https://bazel.build/extending/config#user-defined-transitions)
