# DateTimeFormat integer rendering

Follow-up measurements use cache-only commit `9d76b97721e79cb6164a814de16a5c9b04a810ac`
as baseline. Rust already uses integer civil-time arithmetic; this change targets TS.

`ToLocalTime` previously converted exact epoch nanoseconds to Decimal, divided by
one million, added an offset, then floored. It now floors the BigInt quotient
before conversion to Number. Negative remainders subtract one millisecond.
Integer offsets commute with flooring, so safe integer milliseconds and offsets
use Number addition. Fractional offsets and unsafe integer arithmetic retain the
Decimal path. Fractional offsets must be added before flooring: -1 ns plus 1 ns
is epoch zero, whereas flooring -1 ns first would lose that cancellation.
See [ToLocalTime](https://tc39.es/ecma402/#sec-tolocaltime).

Fractional-second fields truncate integer milliseconds with division by 1, 10 or 100. Their values stay within 0–999, so Decimal arithmetic adds no precision.

NumberFormat's `ToRawFixed` now returns an integer directly when the rounding
increment is one. Both rounding candidates equal the input for every valid
fraction width; append only the required fraction zeros. Preserve the rounding
magnitude for mixed-precision selection. Non-unit increments retain the general
rounding path. See [ToRawFixed](https://tc39.es/ecma402/#sec-torawfixed).
This avoids scaling, flooring, division, coefficient normalization and trimming
for numeric date fields while preserving localized digits through NumberFormat.
It does not duplicate the separate power-of-ten division change in PR #7840.

## Validation

Exact DTF and NumberFormat ICU4J snapshots remain unchanged for TS and Rust.
Regression tests cover negative nanoseconds, Date bounds, fractional-offset
cancellation, all three fractional-second widths, integers beyond Number's safe
range, fractional padding, rounding modes and non-unit increments.
The timezone differential test compares every generated transition boundary.

Benchmarks use Node 24.14.0 on macOS arm64, seven warmed rounds of 12,000 calls
per row. Host NumberFormat and full-polyfill lanes remain separate. Complete
results live in [integer-results.json](../../packages/intl-datetimeformat/benchmark/integer-results.json).
Rust performance, locale payloads and data registration are unchanged.
