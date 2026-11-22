# Relative rounding private mode checks

Reviewed 2026-11-21. Scope: private rounding-mode selection in shared TS
roundRelativeDifference, selected skipped-date behavior, and native Duration
field-bag controls. Complete algorithms remain open. Requested ECMA-262 source
has no Temporal API chapters; this adds no numbered Temporal section signoff
or historical line credit.

## Observable hook and correction

[roundRelativeDifference:967](../../packages/temporal/date-core.ts#L967) formerly
called mode.startsWith('half'). Even though mode is a validated primitive enum,
that property lookup consulted mutable String.prototype.startsWith. Two public
regressions failed with the replaced method's exact exception through
PlainDateTime.until and ZonedDateTime.until. Descriptors restore before assertions.

The branch now compares all five half modes directly: halfCeil, halfFloor,
halfExpand, halfTrunc and halfEven. Valid non-half modes skip the distance/tie
branch as before. No coercion, property lookup or user callback is needed to
compare primitive enum strings. Option Get/ToString/validation happens before
this branch and retains its separate contract. Distance comparisons, signed
selection and half-even parity are unchanged. Rust already matches its enum
directly and needs no correction.

Public controls use 2000-01-01 to 2000-01-20 with largest/smallest month. The
19-day span lies above the 15.5-day midpoint of January's 31-day window, selecting
+1 month for until and -1 for since. These results are literal expectations,
independent of the implementation's rounding helper. Complete callers remain open.

## Native field-bag controls

The shared Duration oracle adds inherited Get/ToNumber interleaving, negative-zero
normalization, abrupt exception identity and no later inherited Get. Native
Hermes invokes this checker after restoring the actual Rust query backend, so
these controls cover its public frontend rather than inferring behavior from
typed Rust inputs. Existing scalar/calendar fixture counts and golden values
remain unchanged. The [field-bag audit](temporal-duration-from-caller-audit.md)
retains type/range/realm and complete caller obligations.

## Precision and remaining windows

The [date-largest precision scan](temporal-date-largest-precision-audit.md)
proves small clock fields and bounded day quotients survive Number/f64 conversion.
Irregular calendar counts require stated provider bounds; endpoint-window
correctness remains distinct. No second premature-conversion defect was found
in those bounded paths. Skipped civil dates can collapse adjacent calendar
endpoints; strict monotonicity must not be assumed.

The [calendar count/window audit](temporal-calendar-count-window-audit.md)
records independent Apia UTC endpoints: subtracting one or two days from
2012-01-01 noon reaches the same instant. The existing one-window retry
selects a distinct bracket. Shared controls cover all nine rounding modes,
until/since and reversed anchors without assuming calendar antisymmetry.

All seven focused gates pass (five executed, two cached), including native
Hermes source/bytecode for Duration and ZonedDateTime. Expanded validation
passes all 27 tests, including 25 affected class/backend gates, relative Duration
and public API/helper controls. Temporal and DurationFormat assemblies pass.
No baselines, exclusions or timeouts changed.

The separately documented
[Apia retry inconsistency](temporal-spec-issues.md#day-window-retry-ignores-shift-after-apias-skipped-date)
affects the historical/published proposal comparison. FormatJS's existing
all-date-unit retry handles this case; it is not a complete derivation from
that proposal branch or an adopted ECMA-262 finding.

## Independent step evidence

BigInt and i128 subtract the selected intermediate instant from the exact
destination. The loop tests the equivalent opposite-sign expression before
balancing clock fields. Fold fixtures distinguish earlier and later candidates.
The choice of intermediate remains a separate open step.
[Temporal comparison §6.5.6 steps 11.c–d](https://tc39.es/proposal-temporal/#sec-temporal-differencezoneddatetime).
[TypeScript subtraction](../../packages/temporal/zoned-date-time.ts#L592).
[Rust subtraction](../../crates/temporal/calendar_difference.rs#L171).

The date-unit caller uses the unrounded zoned difference with the original
endpoints, zone and calendar and the prepared largest unit. If either backend
uses an identical-endpoint shortcut, it takes the callee's zero-result case.
The relative rounding call remains separately conditional.
[Temporal comparison §6.5.7 step 2](https://tc39.es/proposal-temporal/#sec-temporal-differencezoneddatetimewithrounding).
[TypeScript dispatch](../../packages/temporal/zoned-date-time.ts#L670).
[Rust dispatch](../../crates/temporal/calendar_difference.rs#L201).

ComputeNudgeWindow step 8.d.i applies only when its first count is nonzero.
Step 12.a uses the adjacent signed count, which lies strictly farther from
zero. Total's count correction stops at zero because the origin cannot
overshoot a destination in the target direction. The retained-week path also
takes the next count in that direction. Both backends therefore take the
nonzero date-add path and resolve the original local clock compatibly at
these endpoints. Prefix choice and the retry stay separately open.
[Temporal comparison §7.5.33 steps 8.d.i and 12.a](https://tc39.es/proposal-temporal/#sec-temporal-computenudgewindow).
[TypeScript first endpoint](../../packages/temporal/date-core.ts#L1021).
[TypeScript adjacent endpoint](../../packages/temporal/date-core.ts#L1024).
[Rust first endpoint](../../crates/temporal/calendar_difference.rs#L225).
[Rust adjacent endpoint](../../crates/temporal/calendar_difference.rs#L228).

NudgeToZonedTime step 6 adds the duration sign to a day component that has
that sign or is zero. The resulting date duration is nonzero. Calendar
addition regulates the original year/month prefix once, then adds the
signed day. The next endpoint keeps the original clock even if the previous
endpoint was shifted across a gap. The possible zero-date fold discrepancy
at step 5 remains open.
[Temporal comparison §7.5.35 steps 5–6](https://tc39.es/proposal-temporal/#sec-temporal-nudgetozonedtime).
[TypeScript signed day](../../packages/temporal/date-core.ts#L1082).
[Rust signed day](../../crates/temporal/calendar_difference.rs#L275).
[TypeScript compatible resolution](../../packages/temporal/zoned-date-time.ts#L527).
[Rust compatible resolution](../../crates/temporal/zoned.rs#L286).

Nine focused Bazel targets passed. The TypeScript plain relative, zoned
difference and relative Duration gates use the existing signed and precision
fixtures. Native Rust runs the Temporal and calendar core suites. Hermes
runs the plain relative and native plain/zoned oracle targets. TypeScript
declarations also pass. The fixture results support these source proofs.

- Bazel log SHA-256 `0eb542982068c77ccaf47c7fe3714de93d24d242541616e949e6756931d2fa93`
