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

complex_msg: 21.39 µs (48,112 ops/sec)
normal_msg:   3.10 µs (337,642 ops/sec)
simple_msg:   0.54 µs (1,910,194 ops/sec)
string_msg:   0.15 µs (7,461,955 ops/sec)
```

### Rust Parser (WASM)

The Rust parser (optimized build) is **2.3-3.5x faster** than the JavaScript parser:

```
$ bazel run -c opt //crates/icu_messageformat_parser:parser_bench -- --bench --output-format bencher
complex_msg:  9.43 µs (2.27x faster than JS)
normal_msg:   1.18 µs (2.63x faster than JS)
simple_msg:   153 ns  (3.55x faster than JS)
string_msg:   59 ns   (2.47x faster than JS)
```

The Rust parser is also faster than the SWC ICU MessageFormat parser in this
benchmark, ranging from 6% faster on `normal_msg` to 2.14x faster on
`string_msg`.
