# MessageFormat Parser

Hand-written ICU MessageFormat parser with compatible output as
[`intl-messageformat-parser`](https://www.npmjs.com/package/intl-messageformat-parser)
but 6 - 10 times as fast.

## Benchmarks

### JavaScript/TypeScript Parser

```
$ bazel run //packages/icu-messageformat-parser/benchmark:benchmark
complex_msg AST length 2599
normal_msg AST length 400
simple_msg AST length 79
string_msg AST length 36

complex_msg: 23.85 µs (41,931 ops/sec)
normal_msg:   3.27 µs (306,177 ops/sec)
simple_msg:   0.60 µs (1,675,766 ops/sec)
string_msg:   0.32 µs (3,113,287 ops/sec)
```

### Rust Parser (WASM)

The Rust parser (optimized build) is **2.6-3.7x faster** than the JavaScript parser:

```
$ bazel run -c opt //crates/icu_messageformat_parser:comparison_bench
complex_msg:  9.22 µs (2.59x faster than JS)
normal_msg:   1.14 µs (2.87x faster than JS)
simple_msg:   163 ns  (3.68x faster than JS)
string_msg:   118 ns  (2.71x faster than JS)
```

The Rust parser is also 10-11% faster than the SWC ICU MessageFormat parser.
