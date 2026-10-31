# NumberFormat arithmetic follow-up, 2026-10-31

Baseline: `39e4ba7b3f03fd1b90e1d5b61a0f9f35736276aa` (#7834).
[Raw results and profile summary](numberformat-normalization-results.json).

## Profile and change

A CPU profile of the existing optimized audit benchmark, after compiled pattern
plans, assigns ~42% of sampled process time to `removeTrailingZeros` itself.
`FormatNumericToString` accounts for ~83% inclusive time and `ComputeExponent`
~41%; these overlap and must not be added together. Decimal logarithms account
for ~3.5% inclusive time, so they are a smaller immediate target.

BigDecimal division computes 40 extra digits. Exact quotients often leave 40
trailing zeros; normalization previously performed one BigInt remainder/division
per zero. The new path removes eight zeros per iteration, then handles the short
tail. Coefficients without a trailing zero return immediately. Unsafe exponents
retain incremental arithmetic, preserving existing behavior around 2^53.

String trimming was also benchmarked. Eight-digit chunks were modestly faster
for most formatting workloads and avoid converting the coefficient to a string.
The retained change adds no new locale data or public API and keeps division
precision unchanged. Rust arithmetic is unchanged.

## Measurements

One host, optimized Bazel builds, Node 24.14.0, seven rounds of 24,000 calls,
English formatting with all NumberFormat locales registered. Checksums match.
The host lane uses Node's Intl.PluralRules; the explicit polyfill lane installs JS
PluralRules and generated English data. Results are microseconds per call.

| Workload                   | Host baseline | Host chunks | JS plurals baseline | JS plurals chunks |
| -------------------------- | ------------: | ----------: | ------------------: | ----------------: |
| Decimal                    |         2.611 |       1.404 |               2.605 |             1.480 |
| Currency                   |         2.693 |       1.577 |               2.781 |             1.628 |
| Long unit                  |         3.086 |       1.945 |               5.693 |             3.392 |
| Scientific                 |         5.578 |       3.133 |               5.752 |             3.123 |
| Compact                    |        13.437 |       8.598 |              15.828 |             9.876 |
| Compact currency           |        13.331 |       8.735 |              15.912 |             9.959 |
| Compact significant digits |         8.851 |       6.196 |              11.129 |             7.450 |

The host lane improves ~1.4–1.9×; the JS plural lane ~1.5–1.8×. These are Node
microbenchmarks, not measured mobile/Hermes latency. Constructor samples vary,
including slower polyfilled fallback samples; no construction improvement claim.
The optimization targets arithmetic during formatting.

## Validation and next candidates

Tests cover long positive/negative coefficients across chunk boundaries through
1,024 trailing zeros, terminating/repeating division, signed zero, and unsafe
exponents. NumberFormat, PluralRules, DurationFormat and DateTimeFormat suites
exercise the shared arithmetic dependency. Independent ICU snapshots must remain
unchanged; this does not fix the earlier audit's plural/range findings.

Exponent-preview rounding remains a worthwhile candidate. Reusing its result must
respect sign-dependent rounding and exponent changes; the
[ComputeExponent algorithm](https://tc39.es/ecma402/#sec-computeexponent) scales
an absolute value for its preview. Exact magnitude extraction is another candidate,
but the profile suggests lower immediate benefit. Neither is changed here.

```sh
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- --all-locales --iterations=24000
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- --all-locales --polyfill-plurals --iterations=24000
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- \
  --node_options=--cpu-prof --node_options=--cpu-prof-interval=250 \
  --node_options=--cpu-prof-dir=/tmp --iterations=60000
bazel test -c opt //packages/bigdecimal:bigdecimal_test \
  //crates/intl_numberformat/tests:icu4j_conformance_snapshot_test
```
