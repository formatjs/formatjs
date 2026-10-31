# NumberFormat decimal powers and integer construction

Follow-up to [exponent-preview reuse](2026-10-31-numberformat-rounding-reuse.md).
This change targets shared TS BigDecimal arithmetic; Rust remains unchanged.

A JS-PluralRules CPU profile of the previous implementation sampled decimal
parsing at 13.95% self time and `bigintPow10` at 9.98%. The profile includes
registration, constructor and formatting workloads, not only formatting calls.
Plural selection accounts for 16.6% inclusive time; inclusive samples overlap.

Two small changes:

- Lazily retain `10^0` through `10^64` as BigInt primitives. Division repeatedly
  uses `10^40`. At most 65 values remain; larger powers keep the original
  computation without entering the cache.
- Construct nonzero safe integer Numbers directly from their exact BigInt
  coefficient. Fractions and unsafe integers retain shortest-decimal-string
  parsing; negative zero keeps its existing branch. For example, Number
  `1000000000000000100` must retain that decimal representation, rather than
  become the exact binary integer `1000000000000000128`.

No rounding precision, generated locale payload, plural selection or range
behavior changes. No cross-call formatting-result cache.

## Measurements

Optimized Bazel runs compare main `448a46b5c` with the changes on the same macOS
Apple Silicon host, Node 24.14. Seven warm rounds, 24,000 formatting calls per
round, all 657 NumberFormat locales registered. English host/JS PluralRules
providers are separate lanes. A power-cache-only intermediate run isolates
that change; repeated baseline/final JS lanes check variation.

Median µs/call (repeated JS lane shown):

| Lane          | Workload                   | Before | After | Speedup |
| ------------- | -------------------------- | -----: | ----: | ------: |
| TS host       | decimal                    |  1.401 | 1.106 |   1.27× |
| TS host       | currency                   |  1.632 | 1.303 |   1.25× |
| TS host       | unit                       |  1.961 | 1.705 |   1.15× |
| TS host       | scientific                 |  2.427 | 1.872 |   1.30× |
| TS host       | compact                    |  6.892 | 5.057 |   1.36× |
| TS host       | compact currency           |  7.095 | 5.102 |   1.39× |
| TS host       | compact significant digits |  4.930 | 3.802 |   1.30× |
| TS JS plurals | decimal                    |  1.422 | 1.082 |   1.31× |
| TS JS plurals | currency                   |  1.614 | 1.255 |   1.29× |
| TS JS plurals | unit                       |  3.409 | 2.764 |   1.23× |
| TS JS plurals | scientific                 |  2.421 | 1.850 |   1.31× |
| TS JS plurals | compact                    |  7.950 | 5.932 |   1.34× |
| TS JS plurals | compact currency           |  8.124 | 6.111 |   1.33× |
| TS JS plurals | compact significant digits |  6.155 | 4.700 |   1.31× |

Raw timings, checksums and profile summary:
[numberformat-decimal-powers-results.json](numberformat-decimal-powers-results.json).
These are Node microbenchmarks, not measured Hermes/mobile gains. Constructor
samples vary; no constructor improvement claim. Rust arithmetic is unchanged.

## Validation

Boundary tests compare aligned arithmetic with independently computed BigInts,
including powers 63/64/65 through 1,024, signed comparisons, floor/ceil and exact
division. Constructor tests compare over 2,000 safe/unsafe, fractional and
special Number values with the existing string path, including negative zero.

Shared consumers include NumberFormat, PluralRules, DateTimeFormat and
DurationFormat. ICU snapshots must stay unchanged; this does not fix the
original audit's exact-plural or range-affix findings.

```sh
bazel test -c opt //packages/bigdecimal:bigdecimal_test \
  //packages/bigdecimal:typecheck_typecheck_test \
  //packages/intl-numberformat:intl-numberformat_test \
  //packages/intl-pluralrules:intl-pluralrules_test \
  //packages/intl-datetimeformat:intl-datetimeformat_test \
  //packages/intl-durationformat:intl-durationformat_test
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- --all-locales --iterations=24000
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- --all-locales --polyfill-plurals --iterations=24000
```

## Exact plural handoff

NumberFormat still calls the configured PluralRules provider with a Number,
which loses exact decimal operands and repeats rounding. Its host/custom
provider compatibility needs an explicit path before bypassing `select`.
Rust already owns its CLDR rule payload; TS would need an exact predicate
provider or equivalent generated program. That change should measure payload
cost and intentionally review changed ICU differences, separately from these
arithmetic optimizations.
