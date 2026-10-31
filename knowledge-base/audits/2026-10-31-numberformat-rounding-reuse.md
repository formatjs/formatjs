# NumberFormat exponent-preview reuse

Follow-up to [decimal normalization](2026-10-31-numberformat-normalization.md).
TS and Rust notation formatting rounded the same scaled positive value twice:
once to choose the exponent, then again to produce the final digits.

Both now retain the preview's rounded value and formatted digits when the input
is positive and the final exponent matches the preview exponent. This also
covers compact magnitude changes that keep the same exponent. No locale data,
precision, plural selection, or range-collapse behavior changes.

Negative values retain separate final rounding. The
[ComputeExponent algorithm](https://tc39.es/ecma402/#sec-computeexponent) previews
an absolute value; directed rounding of the original negative value can differ.
Exponent rollover also retains final rounding whenever it changes scaling.
Zero and nonfinite inputs keep their existing paths. Preview results live only
for the current call; no cross-call value cache.

## Measurement

Paired optimized Bazel benchmarks compare main `31ea459d3` with this change on
the same macOS host. TS uses Node 24.14 and all 657 NumberFormat locale packs;
host and explicitly polyfilled English PluralRules lanes are separate. Seven
warm rounds, 24,000 formatting calls per TS round; Rust uses seven rounds of
12,000 calls. Workloads mix positive/negative values, zeros and exponent
boundaries. Raw samples and checksums:
[numberformat-rounding-reuse-results.json](numberformat-rounding-reuse-results.json).

Median µs/call:

| Lane          | Workload                   | Before | After | Speedup |
| ------------- | -------------------------- | -----: | ----: | ------: |
| TS host       | scientific                 |  3.106 | 2.448 |   1.27× |
| TS host       | compact                    |  8.445 | 6.769 |   1.25× |
| TS host       | compact currency           |  8.800 | 6.843 |   1.29× |
| TS host       | compact significant digits |  6.041 | 4.922 |   1.23× |
| TS JS plurals | scientific                 |  3.224 | 2.405 |   1.34× |
| TS JS plurals | compact                    |  9.999 | 7.894 |   1.27× |
| TS JS plurals | compact currency           |  9.726 | 7.980 |   1.22× |
| TS JS plurals | compact significant digits |  7.236 | 6.137 |   1.18× |
| Rust          | scientific                 |  0.589 | 0.533 |   1.11× |
| Rust          | compact                    |  0.781 | 0.677 |   1.15× |
| Rust          | compact currency           |  0.841 | 0.736 |   1.14× |
| Rust          | compact significant digits |  0.768 | 0.669 |   1.15× |

These are Node/native microbenchmarks, not mobile/Hermes latency measurements.
No construction or standard-notation speedup claim. Payload unchanged.

## Validation

TS differential tests disable preview reuse and compare exact parts/ranges with
reuse enabled across all nine rounding modes, scientific/engineering/compact,
percent scaling, both signs and signed zero, tiny/exact decimal strings, rounding
increments, significant/fraction digit priorities and exponent rollover.
Rust regressions assert directed negative rounding and rollover output.
Existing TS/Rust parity and independent ICU snapshots remain unchanged.

```sh
bazel test -c opt //packages/intl-numberformat:intl-numberformat_test \
  //crates/intl_numberformat:intl_numberformat_test \
  //crates/intl_numberformat/tests:conformance_test \
  //crates/intl_numberformat/tests:icu4j_conformance_snapshot_test
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- --all-locales --iterations=24000
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- --all-locales --polyfill-plurals --iterations=24000
bazel run -c opt //crates/intl_numberformat:benchmark
```

Exact plural operands and range-affix correctness remain open findings from the
[original audit](2026-10-31-numberformat.md). Preview reuse does not change them.
