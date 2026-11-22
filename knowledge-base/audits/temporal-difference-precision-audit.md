# Exact time-unit differences

Reviewed 2026-11-21 for ZonedDateTime and PlainDateTime `until`/`since`.
This covers time-largest-unit arithmetic and its final Duration conversion.
Calendar/day algorithms and complete public callers remain open. Historical
Temporal operation names remain navigation evidence; this adds no numbered
ECMA-262 Temporal section signoff.

## Defect and independent witness

The exact span `9_007_199_254_741_005 ns` is 104 days plus
05:59:59.254741005, so both public instant and plain-date-time domains admit it.
For a 10 ns quantum, it is exactly halfway between
`9_007_199_254_741_000` and `9_007_199_254_741_010`. Positive half-expand selects
the latter. Both final integers are exactly representable as binary64 Numbers.

Before the fix, [TS time balancing](../../packages/temporal/duration-core.ts#L230)
converted the span to Number `9_007_199_254_741_004` before rounding. Converting
that field back to BigInt put the value below the halfway boundary, selecting
`9_007_199_254_741_000`. [Rust unrounded](../../crates/temporal/calendar_difference.rs#L113)
also constructed a Duration first; [Duration::new:66](../../crates/temporal/duration.rs#L66)
round-trips fields through f64, losing the same bit despite i128 storage.

Final Number conversion is intentional: public Duration fields have Number
precision. Performing that conversion before exact duration rounding changes
which result is selected. This fix moves it after rounding; it does not claim
all large Duration field values remain exact Numbers.

## Changed core

[TS roundRelativeDifference:900](../../packages/temporal/date-core.ts#L900)
retains strict clock-increment validation and the existing equal-endpoint case.
Lines 882–889 take the time-largest branch before creating balanced Number fields:
compute the original epoch difference, apply the `since` sign, round in BigInt,
then balance the rounded integer once into final Number fields.

[Rust difference:177](../../crates/temporal/calendar_difference.rs#L177)
retains `validate_options` before the equal-endpoint return. Lines 182–187 use
the original i128 difference, round it, then construct the final Duration.
Validated unit ordering ensures that a time largest unit also has a time smallest
unit, so the smallest-unit unwrap is justified. Increment validation establishes
a positive quantum within its strict unit maximum.

For `until`, both branches round `end - start`. For `since`, they round
`start - end` directly. This is equivalent to negating the rounding mode before
rounding the original difference, then negating the result; it preserves `ceil`
and `floor` direction as well as signed ties. No second `since` negation is
applied after the early return.

## Effects, bounds and scope

Both public TS callers still convert `other`, compare calendars and read/convert
all options before entering this core. Their existing option-order issue belongs
to the separate pending #8055 work. The ZonedDateTime caller still applies zone
identity checks only for date largest units. Rust caller calendar/zone checks
also remain before the shared core.

The skipped time-unit unrounded paths perform epoch subtraction and private
balancing; they do not invoke calendar arithmetic, local-time resolution or a
zone offset provider. See [TS plain](../../packages/temporal/date-core.ts#L802),
[TS zoned](../../packages/temporal/zoned-date-time.ts#L520) and
[Rust](../../crates/temporal/calendar_difference.rs#L113). Avoiding those private
intermediates skips no required input getter or provider callback. Complete
intrinsic-mutation and realm contracts remain separate work.

Public endpoints bound the span by twice the epoch limit, plus at most two local
padding days for plain date-times. Its magnitude stays below `1.729e22 ns` even
after rounding by less than one day. This is far below both i128 capacity and
the approximately `9.007e24 ns` Duration limit, so removing the discarded balance
cannot remove a required duration-range rejection for these inputs.

The new branch applies only to hour or smaller largest units. Final balancing
leaves years/months/weeks/days zero and starts at the requested time unit.
Year/month/week/day largest-unit paths retain their existing calendar and
variable-day behavior; this review does not sign them off.

[Public TS controls](../../packages/temporal/tests/zoned-differences.test.ts#L24)
cover both APIs, both endpoint orders, `until`/`since`, half-expand/half-trunc and
ceil/floor with hardcoded expected multiples. Typed Rust controls exercise the
same public operations without deriving expectations from production rounding.

## Validation

Before correction, public TS and typed Rust regressions both selected
`9_007_199_254_741_000` instead of `9_007_199_254_741_010`. Focused tests pass
after correction. Expanded validation passes 49 tests (46 executed, three cached),
including all 40 Temporal class/backend gates; Temporal and DurationFormat
assemblies pass. Runtime files remain unchanged after this expanded run.

Additional hardcoded controls cover large leading microsecond/millisecond fields
and all ten final fields. The shared zoned oracle also checks signed until/since
results for both APIs in nanoseconds, microseconds and milliseconds; it runs
through TS and the native Hermes source/bytecode facade. Existing ICU fixture
counts and golden values remain unchanged. All five final extended gates pass (three executed, two cached), including
the native Hermes oracle and both relevant typechecks.

No baseline, exclusions or timeout changes. This is an implementation precision
defect, not a new specification issue. Complete calendar/day differences, callers
and authoritative Temporal API section mapping remain open.
