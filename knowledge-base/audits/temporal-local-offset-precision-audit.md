# Local timestamp conversion precision

Reviewed 2026-11-21. This is bounded precision evidence for
[ECMA-402 §11.5.11 ToLocalTime](https://tc39.es/ecma402/#sec-tolocaltime),
steps 1–3, using the offset contract from
[ECMA-262 §21.4.1.33.2](https://tc39.es/ecma262/#sec-parsetimezoneoffsetstring).
It does not sign off the complete operation, its parser or its callers.

## Code and bounds

Numeric DateTimeFormat inputs pass through
[TimeClip and exact BigInt scaling](../../packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.ts#L32).
The largest accepted integer millisecond magnitude, 8,640,000,000,000,000,
is below 2**53. Conversion to BigInt is exact; multiplication by one million
happens after conversion. Temporal records retain their BigInt nanoseconds.
The [TimeClip audit](temporal-timeclip-audit.md) covers that numeric contract.

[ToLocalTime:95](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L95)
divides nanoseconds as BigInt and adjusts negative remainders before converting
the integer millisecond quotient to Number. Its integer-offset shortcut requires
safe integer milliseconds, offset and sum at
[108](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L108).
For valid Date/Temporal timestamp magnitudes these integers fit in the exact
Number range. The helper does not independently validate arbitrary BigInt inputs;
complete public range/brand validation remains separate work.

Fractional offsets use
[@formatjs/bigdecimal](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L114):
the original nanosecond integer becomes a decimal string, then division and offset
addition precede flooring. Constructing Decimal from a prematurely rounded Number
would preserve that rounding error. The shared scanner returns exact integer Number nanoseconds, then the
formatter converts that bounded offset to milliseconds before this addition; the tests below exercise that boundary but
do not constitute an exhaustive arithmetic or grammar proof.

Public Intl.DateTimeFormat offset identifiers remain minute-only. Second and
fractional offsets here exercise the internal operation's broader representation;
they do not extend accepted constructor options. Named-zone transition selection,
calendar projection and mutable intrinsic access remain open review areas.

## Regression evidence

The new [fractional-offset matrix](../../packages/intl-datetimeformat/tests/rust-timezones.test.ts#L226)
now checks 72 combinations: positive/negative maximum offsets and mixed-digit offsets,
both dot/comma fraction separators, three local midnight anchors (epoch and one day inside both Date limits), and
one nanosecond before, exactly at and one nanosecond after each midnight.
Subtracting a fixed, independently specified integer offset constructs each input.
Expected fields come from builtin Date at the known local anchor or its preceding
millisecond. This avoids Number conversion of the epoch nanoseconds in the oracle.
Extreme combinations reach both exact Instant limits and adjacent nanoseconds.

A deliberate fault replaced `new Decimal(String(epochNanoseconds))` with
`new Decimal(Number(epochNanoseconds))`. The new matrix failed for
`-8639999999999999999999n` with `+23:59:59.999999999`: expected local midnight,
received the previous day's `23:59:59.999`. At that checkpoint, the other four tests in the target
passed under this fault. Restoring the original runtime makes all five pass.
No runtime change is needed for these vectors.

Existing [negative-submillisecond cancellation controls](../../packages/intl-datetimeformat/tests/rust-timezones.test.ts#L207)
check ±1 ns and ±999999 ns around epoch zero. Public
[format, parts and range controls](../../packages/intl-datetimeformat/tests/temporal.test.ts#L222)
check ±1 ns and adjacent nanoseconds at both Date limits against exact BigInt
flooring. [Plain-date coverage](../../packages/intl-datetimeformat/tests/temporal-owned.test.ts#L327)
checks the extra supported day below the Date minimum.

These regressions detect specific lossy conversions; they do not prove every
Number conversion safe. The complete ToLocalTime algorithm and Temporal chapter
citation selection remain open. No specification inconsistency found here.

## Validation

All six focused Bazel gates pass (four executed, two cached): timezone runtime,
both timezone compiler checks, public Temporal formatting, owned Temporal locale
formatting, and shared ECMA-262 helper tests. No runtime, baseline, exclusions or
timeouts changed. The complete expanded inventory was not rerun for this test-only
change.

The checked-in validation inventory now includes the timezone runtime target and
both of its compiler gates, previously absent from that inventory. The runtime
target also compares TS/Rust against all 64,903 all-zone and 41,383 golden-zone
transition/boundary samples. Those differential comparisons are distinct from
the new builtin-Date precision oracle.

The [shared-scanner integration](temporal-offset-grammar-audit.md#shared-scanner-and-datetimeformat-integration)
adds the comma half of the current 72-vector matrix. Before that correction,
`-86400000000000n` with `+23:59:59,999999999` used zero offset instead of the
specified fractional offset and failed the local-time fields. All 72 vectors
pass with the shared scanner. The epoch Decimal path is unchanged; the earlier
premature-Number fault remains historical evidence from the original dot vectors.
