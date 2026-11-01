# NumberFormat power-of-ten division

Follow-up to [numeric exponent caching](2026-10-31-numberformat-exponent-cache.md).
The previous JS-plural profile sampled zero normalization at 19.62% self time
across the full benchmark process.

BigDecimal division always multiplied its numerator by `10^40`, divided the
coefficients, then removed trailing zeros. For normalized divisors with
coefficient `1` or `-1`, the quotient contains exactly those 40 padding zeros.
The work cancels: keep the numerator coefficient, adjust the exponent, and flip
the coefficient sign for a negative divisor.

This affects default fixed rounding's division by increment `1`, as well as
significant-digit rounding's power-of-ten scaling. Removing the padding avoids
BigInt multiplication, division and zero stripping on these paths. The existing
eight-digit normalization loop remains unchanged.

The shortcut requires both the exponent difference and its precision-adjusted
value (`difference - 40`) to be safe integers. Other cases retain the original
arithmetic, including its unsafe-exponent rounding. Special values and signed
zero take the existing branches; zero exponent metadata remains positive zero.
Other divisors retain the original 40-digit division precision.

Rust arithmetic, locale payloads and NumberFormat rounding policy are unchanged.

## Original measurements

Optimized Bazel runs compare main `b567ec806` with this change on macOS Apple
Silicon, Node 24.14. Seven warm rounds, 24,000 formatting calls per round,
all 657 NumberFormat locales registered. English host and JS PluralRules lanes
are separate; repeated JS baseline/final runs check variation.

Median µs/call (repeated JS lane shown):

| Lane          | Workload                   | Before | After | Speedup |
| ------------- | -------------------------- | -----: | ----: | ------: |
| TS host       | decimal                    |  1.040 | 0.737 |   1.41× |
| TS host       | currency                   |  1.204 | 0.899 |   1.34× |
| TS host       | unit                       |  1.569 | 1.297 |   1.21× |
| TS host       | scientific                 |  1.736 | 1.290 |   1.35× |
| TS host       | compact                    |  4.160 | 3.117 |   1.33× |
| TS host       | compact currency           |  4.225 | 3.194 |   1.32× |
| TS host       | compact significant digits |  3.002 | 2.341 |   1.28× |
| TS JS plurals | decimal                    |  1.090 | 0.773 |   1.41× |
| TS JS plurals | currency                   |  1.260 | 0.922 |   1.37× |
| TS JS plurals | unit                       |  2.666 | 2.106 |   1.27× |
| TS JS plurals | scientific                 |  1.734 | 1.278 |   1.36× |
| TS JS plurals | compact                    |  4.859 | 3.571 |   1.36× |
| TS JS plurals | compact currency           |  4.945 | 3.645 |   1.36× |
| TS JS plurals | compact significant digits |  3.681 | 2.871 |   1.28× |

Raw timings, checksums and baseline profile summary:
[numberformat-power-division-results.json](numberformat-power-division-results.json).
These are Node microbenchmarks, not measured Hermes/mobile gains. Registration
and construction stay separate; no constructor speedup claim.

## Rebased measurements after integer fixed rounding

Fresh comparison against main `73430970a`, including the merged DateTimeFormat
integer-rendering change. That change skips fixed-rounding arithmetic for exact
integers; power-of-ten division still benefits fractional and significant-digit
paths. Same optimized Bazel harness, seven rounds of 24,000 calls, with host and
JS PluralRules runs performed sequentially.

Median µs/call:

| Lane          | Workload   | Before | After | Speedup |
| ------------- | ---------- | -----: | ----: | ------: |
| TS host       | decimal    |  0.925 | 0.663 |   1.40× |
| TS host       | scientific |  1.591 | 1.208 |   1.32× |
| TS JS plurals | decimal    |  0.940 | 0.665 |   1.41× |
| TS JS plurals | compact    |  5.157 | 3.763 |   1.37× |

All seven formatting workloads improve 1.25–1.40× in the host lane and
1.27–1.41× with JS PluralRules. Checksums match for all ten rows in both lanes,
including constructor controls. Raw data is under `rebased` in the companion
results JSON. These measurements do not establish Hermes/mobile or constructor
speedups.

## Validation

A differential test reconstructs the original scaled quotient and normalization
from stored coefficients/exponents. It covers positive/negative coefficients,
power and non-power divisors, scales through ±1,000, safe-integer boundaries,
unsafe differences and cancellation back into the safe range. Other tests retain
signed-zero scales, zero/infinity/NaN signs and repeating-division precision.

Shared formatter suites, Test262 and independent ICU snapshots guard public
results. Conformance snapshots must remain unchanged.

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

The original audit's exact-plural and range-affix issues remain separate
correctness work.
