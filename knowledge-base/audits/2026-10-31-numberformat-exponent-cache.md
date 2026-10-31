# NumberFormat numeric exponent cache

Follow-up to [decimal powers and integer construction](2026-10-31-numberformat-decimal-powers.md).
The remaining generic memoizer serialized Decimal exponent objects into JSON,
including decimal text conversion. Equivalent Number/Decimal exponents also
occupied separate cache entries. The previous JS-plural profile sampled
`serializerDefault` at 6.86% self time across the full benchmark process.

`getPowerOf10` now keys directly by the effective Number exponent, matching the
coercion already performed by `Decimal.pow(10, exponent)`. Cache hits return
before retention checks. Integers from -324 through 324 can occupy at most 649
entries. Other exponents delegate without retention, preserving Decimal behavior.
The NumberFormat Bazel library drops its direct fast-memoize dependency.

BigDecimal also converts an integer coefficient with exponent zero directly via
`Number(bigint)`, avoiding a temporary decimal string. Special values, signed
zero, fractional and scaled coefficients keep their existing branches. Tests
compare rounding near binary64 halfway cases and finite/infinite boundaries,
including both signs and coefficients through 4,096 bits.

Rust arithmetic, generated locale payloads and rounding policy remain unchanged.

## Measurements

Optimized Bazel benchmarks compare main `3f4eaf28e` with these changes on macOS
Apple Silicon, Node 24.14. Seven warm rounds, 24,000 formatting calls per round,
all 657 NumberFormat locales registered. Host and JS PluralRules lanes are
separate. Intermediate runs isolate numeric keys and integer conversion before
moving cache-bound checks off the hit path. Repeated JS runs check variation.

Median µs/call (repeated JS lane shown):

| Lane          | Workload                   | Before | After | Speedup |
| ------------- | -------------------------- | -----: | ----: | ------: |
| TS host       | decimal                    |  1.076 | 1.043 |   1.03× |
| TS host       | currency                   |  1.254 | 1.211 |   1.04× |
| TS host       | unit                       |  1.605 | 1.559 |   1.03× |
| TS host       | scientific                 |  1.844 | 1.743 |   1.06× |
| TS host       | compact                    |  4.805 | 4.120 |   1.17× |
| TS host       | compact currency           |  4.891 | 4.221 |   1.16× |
| TS host       | compact significant digits |  3.619 | 3.014 |   1.20× |
| TS JS plurals | decimal                    |  1.164 | 1.031 |   1.13× |
| TS JS plurals | currency                   |  1.309 | 1.216 |   1.08× |
| TS JS plurals | unit                       |  2.860 | 2.745 |   1.04× |
| TS JS plurals | scientific                 |  1.859 | 1.737 |   1.07× |
| TS JS plurals | compact                    |  5.994 | 4.961 |   1.21× |
| TS JS plurals | compact currency           |  6.035 | 5.064 |   1.19× |
| TS JS plurals | compact significant digits |  4.673 | 3.781 |   1.24× |

Compact workloads improve about 1.15–1.24× across initial/repeated pairs.
Other shifts are smaller and vary between runs; no broad standard-notation
speedup claim.

Raw timing ranges, checksums and baseline profile summary:
[numberformat-exponent-cache-results.json](numberformat-exponent-cache-results.json).
These are Node microbenchmarks, not mobile/Hermes latency. Construction and
registration are separate measurements; no constructor speedup claim.

## Validation

Cache tests compare Number/Decimal keys, signed zero, exact powers at both cache
boundaries and uncached scales. Non-integer/nonfinite inputs retain the underlying
Decimal operation's behavior. Conversion tests compare with decimal-text Number
conversion around powers of two, halfway cases, overflow, underflow and signed
zero. Shared formatter suites and independent ICU snapshots guard public output.

```sh
bazel test -c opt //packages/bigdecimal:bigdecimal_test \
  //packages/bigdecimal:typecheck_typecheck_test \
  //packages/intl-numberformat:intl-numberformat_test \
  //packages/intl-pluralrules:intl-pluralrules_test \
  //packages/intl-datetimeformat:intl-datetimeformat_test \
  //packages/intl-durationformat:intl-durationformat_test \
  //crates/intl_numberformat/tests:icu4j_conformance_snapshot_test \
  //crates/intl_numberformat/tests:conformance_test
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- --all-locales --iterations=24000
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- --all-locales --polyfill-plurals --iterations=24000
```

Exact plural operands and range-affix issues from the original audit remain
separate correctness work. This change does not update conformance snapshots.
