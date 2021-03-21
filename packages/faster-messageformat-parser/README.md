# MessageFormat Parser

Hand-written ICU MessageFormat parser with compatible output as
[`intl-messageformat-parser`](https://www.npmjs.com/package/intl-messageformat-parser)
but 6 - 10 times as fast.

```
$ node benchmark
complex_msg AST length 10861
normal_msg AST length 1665
simple_msg AST length 364
string_msg AST length 131

== Baseline ==
complex_msg x 4,884 ops/sec ±0.97% (91 runs sampled)
normal_msg x 40,113 ops/sec ±1.08% (92 runs sampled)
simple_msg x 200,401 ops/sec ±1.12% (91 runs sampled)
string_msg x 241,103 ops/sec ±0.84% (92 runs sampled)

== This package ==
complex_msg x 31,590 ops/sec ±0.80% (88 runs sampled)
normal_msg x 278,703 ops/sec ±0.83% (95 runs sampled)
simple_msg x 2,038,061 ops/sec ±0.90% (96 runs sampled)
string_msg x 2,392,794 ops/sec ±0.67% (96 runs sampled)
```
