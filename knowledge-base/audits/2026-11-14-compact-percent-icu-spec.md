# Compact notation: ICU and ECMA-402

[Polyfill fix #7940](https://github.com/formatjs/formatjs/pull/7940) fixes lost
style/sign affixes in TS and Rust. [Spec PR #1117](https://github.com/tc39/ecma402/pull/1117)
addresses layouts the current spec cannot express.

## Root cause

Compact patterns replaced the style/sign pattern. Percent lost its sign;
currency/accounting affixes and grouping could also change.

The fix inserts unsigned decimal compact notation into the selected style/sign
pattern. Percent keeps `percentSign` parts. Currency keeps its ordinary envelope,
including accounting. All styles share decimal compact data; generation drops
unused currency compact tables. Legacy payloads still load (wire version 1).
TS caches composed plans; Rust streams their tokens using bound style-plan IDs.

Range collapse also preserves negative endpoint signs and accounting pairs.
Previously, `[-3, -2]` and `[-3, 2]` could both become `-3–2 meters`, violating
[CollapseNumberRange's ambiguity rule](https://tc39.es/ecma402/#sec-collapsenumberrange).
Safe affix sharing remains allowed.

## Why ICU still differs

ICU replaces its middle modifier for compact notation, then adds percent through
an outer unit modifier. This explains both its placement and `unit` parts.
Java and C agree; the oracle adapter is reporting ICU's fields correctly.
See [ICU4C construction](https://github.com/unicode-org/icu/blob/release-79.1/icu4c/source/i18n/number_formatimpl.cpp#L150-L161)
and [ICU4J construction](https://github.com/unicode-org/icu/blob/release-79.1/icu4j/main/core/src/main/java/com/ibm/icu/number/NumberFormatterImpl.java#L205-L216).

Current ECMA-402 selects style/sign separately from compact notation and requires
`percentSign` for percent style. That cannot generally express ICU's
notation-dependent percent or currency layout. This is the gap in
[#439](https://github.com/tc39/ecma402/issues/439); #1117 proposes complete compact
patterns while retaining `percentSign`.

Examples from Node 26.5.1 / ICU 78.3 / CLDR 48, formatting `-10` as percent:

- Turkish: standard `-%1.000`; compact `%-1\u00a0B`.
- Swahili: standard `-1,000%`; compact `asilimia elfu\u00a0-1`.
- English: compact text `-1K%` agrees, but ICU returns a `unit` part for `%`.

The issue is notation-dependent layout and field semantics; a word such as
`asilimia` is not itself forbidden as a locale's percent representation.

Exact-count elision, such as French `mille` versus `2 mille`, needs value-dependent
pattern selection and remains separate. CLDR's raw `0` fallback marker also
needs to remain distinct from a numberless template.
See [CLDR compact formats](https://unicode.org/reports/tr35/tr35-numbers.html#Compact_Number_Formats)
and [ICU compact lookup](https://github.com/unicode-org/icu/blob/release-79.1/icu4c/source/i18n/number_compact.cpp#L54-L128).

Source versions: ICU 79.1 / CLDR 49 (`ddc6b66926bfac6036144ca9902992a0d6d50af9`);
ECMA-402 [`af194df`](https://github.com/tc39/ecma402/blob/af194df3c8633510a6c5982e8dbdb00cb3b6105f/spec/numberformat.html#L1478-L1505).
The native examples above use the older ICU version shown.

## Validation

All 18 focused Bazel targets pass on main `9870106e6`: TS/Rust tests, generated
locale suites, typechecks, both ICU snapshot gates, and Hermes source/bytecode
parity. Test262: 500 passes, two tracked failures, 502 executions. Hooks pass.
Main's retained string precision gives `1.0K%` / `1.0M%` in rollover tests.

The oracle matrix covers 38,136 cases across 657 locale packs; TS/Rust text and
parts agree. Raw ICU output stays untouched. Java discrepancies: 324 removed,
144 changed, 1,670 added. C text discrepancies: 330 removed, 42 changed, 1,261
added. Changes are confined to compact notation, negative ranges, or new Turkish
coverage; most new Java differences come from added compact-percent cases.
These snapshot gates track regressions, not complete ICU conformance.

The 528 changed locale snapshots are compact-percent cases; 352 parts snapshots
check `percentSign` without `unit`. Tests cover signs, signed zero, nonfinite
values, rollover, grouping, numberless templates, accounting, and range sources.

## Benchmarks

Seven rounds of 12,000 calls, optimized Bazel builds, Intel Xeon Platinum 8488C;
baseline `b05a036be`. TS uses Node 24.14.0 / ICU 78.2.

| Workload              | Before µs | After µs |
| --------------------- | --------: | -------: |
| TS compact percent    |     5.809 |    5.854 |
| TS compact currency   |     7.112 |    7.152 |
| Rust compact percent  |     1.193 |    1.261 |
| Rust compact currency |     1.079 |    1.118 |

TS stays roughly flat. Rust compact workloads take 4–6% longer with the corrected
output. Streaming recovers 2–5% over the first correct prototype. English locale
input shrinks 3.5%. Compact output checksums intentionally change; standard
checksums match. [Raw measurements and oracle deltas](numberformat-composition-results.json).

```sh
bazel test -c opt //packages/intl-numberformat:{misc_tests,intl-numberformat_test,test262}
bazel test -c opt //crates/intl_numberformat:intl_numberformat_test //crates/intl_numberformat/tests:{conformance_test,packs_test,icu4j_conformance_snapshot_test,icu4c_conformance_snapshot_test}
bazel test -c opt //native/hermes/tests:numberformat_conformance_test
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- --iterations=12000
bazel run -c opt //crates/intl_numberformat:benchmark -- --iterations=12000
```
