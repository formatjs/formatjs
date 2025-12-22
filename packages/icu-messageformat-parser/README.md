# MessageFormat Parser

Hand-written ICU MessageFormat parser with compatible output as
[`intl-messageformat-parser`](https://www.npmjs.com/package/intl-messageformat-parser)
but 6 - 10 times as fast.

```
$ bazel run //packages/icu-messageformat-parser/benchmark:benchmark
complex_msg AST length 2599
normal_msg AST length 400
simple_msg AST length 79
string_msg AST length 36

complex_msg x 58,910 ops/sec ±0.33%
normal_msg x 405,440 ops/sec ±0.53%
simple_msg x 2,592,098 ops/sec ±0.44%
string_msg x 4,511,129 ops/sec ±2.22%
```
