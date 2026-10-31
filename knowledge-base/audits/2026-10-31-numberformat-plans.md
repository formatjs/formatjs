# NumberFormat compiled plans, 2026-10-31

Baseline: `6e26b50cb70b5d07c8b2c4e54f2e8bec3bd23bc7` (#7832).
[Measurements](numberformat-plans-results.json) contain the full benchmark output.

## Change

Bazel's CLDR generator compiles number templates into a shared TS/Rust wire schema.
Each raw standard/percent/currency/accounting/compact template selects six sign
plans, including approximate variants. A flat plan is
`[primaryGroupingSize, secondaryGroupingSize, ...tokenIDs]`. Tokens and complete
plans are deduplicated per locale, including numbering-system aliases.

Generated-pack formatting selects a plan instead of parsing signs, running number
pattern regexes, splitting grouping patterns, and rewriting compact templates.
Currency labels and spacing remain dynamic. TS lazily prepares token references;
Rust borrows the flat token IDs. Both retain cached adapters for older raw packs.
Rust validates schema version, variant counts, grouping and token indices on load.

The optional field preserves formatVersion 1 compatibility: older readers ignore
it, and raw strings remain available. This is the number-pattern stage of the IR
proposal. Unit-template composition, exact plural operands, compact exact-count
extraction, and range-collapse correctness remain separate work. The independent
ICU snapshots are unchanged.

## Warm formatting

One host, optimized Bazel builds, Node 24.14.0, seven rounds of 24,000 calls;
constructor rounds contain 1,000 calls. Paired baseline/prototype runs use the
same benchmark code and values. Output checksums match. These are microseconds
per call, not mobile/Hermes end-to-end timings.

| Workload                   | TS baseline | TS plans | Rust baseline | Rust plans |
| -------------------------- | ----------: | -------: | ------------: | ---------: |
| Decimal                    |       2.995 |    2.583 |         0.510 |      0.432 |
| Currency                   |       3.229 |    2.774 |         1.048 |      0.679 |
| Long unit                  |       3.574 |    3.183 |         1.369 |      0.990 |
| Scientific                 |       6.067 |    5.687 |         0.940 |      0.618 |
| Compact                    |      14.299 |   13.733 |         1.304 |      0.813 |
| Compact currency           |      14.306 |   13.820 |         1.371 |      0.868 |
| Compact significant digits |       9.708 |    9.211 |         1.255 |      0.798 |

TS exact construction is effectively unchanged: 8.765 → 8.739 µs. Best-fit fallback
is 10.044 → 9.908 µs; lookup fallback 4.963 → 4.863 µs. Earlier paired runs showed
variation in the small native decimal improvement; its existing fast path remains.
The repeatable native gain is currency/compact/scientific (~1.5–1.6×).

A separate optimized run with compiled metadata stripped from the native pack
confirmed that the cached legacy adapter retains most warm-format gains. It parses
a template on first use and takes a cache lock, whereas generated plans avoid both.
No cold-first-format improvement is claimed here.

## Payload and registration costs

Totals below cover all 657 generated JSON payloads, not npm package tarballs.
Gzip totals compress each file independently with a fixed timestamp.

| Payload      | Baseline bytes | Plans bytes | Baseline gzip | Plans gzip |
| ------------ | -------------: | ----------: | ------------: | ---------: |
| TS raw JSON  |     50,691,901 |  62,686,381 |     5,577,038 |  6,256,793 |
| Native packs |     27,528,311 |  29,616,628 |     5,082,379 |  5,617,080 |

This is ~24% / 8% more uncompressed TS/native data and ~12% / 11% more gzip data.
Raw templates remain alongside the optional compiled representation. The compiler
initially emitted object plans with repeated token strings; token interning and
flat arrays substantially reduced that overhead.

TS reading/parsing/registering all packs measured 167 → 184 ms in the final pair.
This includes filesystem noise and is one load per process. Native English pack
registration measured 183 → 204 µs, including registry creation, parsing and drop,
over seven rounds of 25 loads. Prepared data trades payload/load cost for faster
repeated formatting; it does not improve every workload.

## Validation and reproduction

TS/Rust tests, full pack loading, both Hermes suites, Test262, and independent ICU
snapshots guard public behavior. New tests compare generated and legacy text,
parts and approximate ranges; preserve caller payloads; exercise numbering-system
deduplication and changed-pattern fallback; and reject malformed native indices.
No snapshot rebaseline is expected for this change.

```sh
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- --all-locales --iterations=24000
bazel run -c opt //crates/intl_numberformat:benchmark -- --iterations=24000
bazel run -c opt //crates/intl_numberformat:benchmark -- --iterations=24000 --legacy-patterns
bazel test -c opt //crates/intl_numberformat/tests:icu4j_conformance_snapshot_test
# Linux x86_64 / RBE:
bazel test -c opt //crates/intl_numberformat/tests:icu4c_conformance_snapshot_test
```
