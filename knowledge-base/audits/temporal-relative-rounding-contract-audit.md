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
[Rust subtraction](../../crates/temporal/calendar_difference.rs#L206).

The date-unit caller uses the unrounded zoned difference with the original
endpoints, zone and calendar and the prepared largest unit. If either backend
uses an identical-endpoint shortcut, it takes the callee's zero-result case.
The relative rounding call remains separately conditional.
[Temporal comparison §6.5.7 step 2](https://tc39.es/proposal-temporal/#sec-temporal-differencezoneddatetimewithrounding).
[TypeScript dispatch](../../packages/temporal/zoned-date-time.ts#L672).
[Rust dispatch](../../crates/temporal/calendar_difference.rs#L236).

ComputeNudgeWindow step 8.d.i applies only when its first count is nonzero.
Step 12.a uses the adjacent signed count, which lies strictly farther from
zero. Total's count correction stops at zero because the origin cannot
overshoot a destination in the target direction. The retained-week path also
takes the next count in that direction. Both backends therefore take the
nonzero date-add path and resolve the original local clock compatibly at
these endpoints. Prefix choice and the retry stay separately open.
[Temporal comparison §7.5.33 steps 8.d.i and 12.a](https://tc39.es/proposal-temporal/#sec-temporal-computenudgewindow).
[TypeScript first endpoint](../../packages/temporal/date-core.ts#L1023).
[TypeScript adjacent endpoint](../../packages/temporal/date-core.ts#L1026).
[Rust first endpoint](../../crates/temporal/calendar_difference.rs#L262).
[Rust adjacent endpoint](../../crates/temporal/calendar_difference.rs#L265).

NudgeToZonedTime step 6 adds the duration sign to a day component that has
that sign or is zero. The resulting date duration is nonzero. Calendar
addition regulates the original year/month prefix once, then adds the
signed day. The next endpoint keeps the original clock even if the previous
endpoint was shifted across a gap. The possible zero-date fold discrepancy
at step 5 remains open.
[Temporal comparison §7.5.35 steps 5–6](https://tc39.es/proposal-temporal/#sec-temporal-nudgetozonedtime).
[TypeScript signed day](../../packages/temporal/date-core.ts#L1091).
[Rust signed day](../../crates/temporal/calendar_difference.rs#L321).
[TypeScript compatible resolution](../../packages/temporal/zoned-date-time.ts#L527).
[Rust compatible resolution](../../crates/temporal/zoned.rs#L294).

Nine focused Bazel targets passed. The TypeScript plain relative, zoned
difference and relative Duration gates use the existing signed and precision
fixtures. Native Rust runs the Temporal and calendar core suites. Hermes
runs the plain relative and native plain/zoned oracle targets. TypeScript
declarations also pass. The fixture results support these source proofs.

- Bazel log SHA-256 `0eb542982068c77ccaf47c7fe3714de93d24d242541616e949e6756931d2fa93`

## Discarded gap probe at a borrowed calendar boundary

A validated borrowed table may end before an otherwise representable local
date. In the regression, March 13, 2021 at 02:30 is inside the table. March
14 at 02:30 falls in the spring-forward gap and resolves to 03:30 after the
target of 03:10. The selected intermediate date is March 13. Rust previously
queried the uncovered March 14 calendar date even though timezone selection
would discard it, returning `OutOfRange` instead of `PT23H40M`.

When the origin projects successfully and the candidate's calendar
projection returns `OutOfRange`, the corrected path uses the existing
compatible timezone resolver for that raw local probe. It discards the
calendar error only if the probe overshoots the target. At a target of
03:30 the uncovered date is selected and still returns `OutOfRange`.
Successful provider paths and the published reverse-fold comparison remain
separately governed. Bundled TypeScript calendar providers cover the valid
local-date hull and do not have the borrowed-table boundary in this case.

The new public regression fails with the original implementation. All
three Rust Bazel targets pass afterward.
[Calendar field selection](../../crates/temporal/calendar_difference.rs#L169).
[Compatible zone resolution](../../crates/temporal/zoned_difference.rs#L103).
[Public borrowed-table regression](../../crates/temporal/calendar.test.rs#L22).
[Temporal comparison §6.5.6 steps 11.c and 14](https://tc39.es/proposal-temporal/#sec-temporal-differencezoneddatetime).

- Failing Rust replay SHA-256 `61b837208bd99a844bb510b2dd7cfbf06cc2c740c813e496c62f2d21bf5b21d0`
- Passing Rust Bazel log SHA-256 `a7281152c4feb6925b4e2d33888fcc3269ba1fef533088901b999e28550e4fcc`

## Borrowed timezone rounding and plain date transport

Rust now handles equal local ISO dates using exact elapsed time, before
reading calendar dates or local clocks. A borrowed calendar may exclude
the ISO day even when both instants are representable. Both directions,
an identical instant and two occurrences of a folded wall clock keep
the elapsed result.

For different dates, a borrowed table can exclude either the rejected
candidate or the origin. The correction preserves the calendar error if
an unequal date is selected. If the gap probe is rejected and selection
returns to the origin's ISO date, the date portion is zero without a
calendar lookup. For an unequal selected day, each engine retains the
calendar date difference for that day and the prepared unit. This closes
the call step under the selected-day and CalendarDateUntil contracts. The
reverse-fold choice and published ISO calendar discrepancy remain open.

[Same-day path](../../crates/temporal/calendar_difference.rs#L134).
[Selected day](../../crates/temporal/calendar_difference.rs#L198).
[Borrowed-calendar regressions](../../crates/temporal/calendar.test.rs#L37).
[Temporal comparison §6.5.6 steps 4.a–b](https://tc39.es/proposal-temporal/#sec-temporal-differencezoneddatetime).

A valid borrowed zone can change from −23:00 to +12:00. In the public
positive regression, origin and target are hours 24 and 61 after the epoch.
The two-day endpoint is hour 72 because its local clock lies inside the
gap. The original retry moved farther from the target and returned
`P4D` for truncation. The bracketing pair instead uses the origin and the
two-day endpoint. Truncation returns zero, and ceil and half-expand return
`P2D`. A second transition gives a reverse control with origin hour 125,
target hour 53 and negative two-day endpoint hour 42.

The first-bound retry now moves toward the origin. A second endpoint
short of the target still moves away from the origin. At an increment of
two days, successive fixed-clock local endpoints differ by 48 hours, which
exceeds the difference of two valid offsets. Compatible gap resolution
uses an effective offset within the same bounds. The two controls verify
the signed retry for this branch. The wider provider/window and published
assertion issues remain in the ledger.
[Signed retry](../../crates/temporal/calendar_difference.rs#L269).
[Public borrowed-zone controls](../../crates/temporal/lib.test.rs#L3843).
[Temporal comparison §7.5.34 steps 5–6, 13 and 17](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit).

The PlainDate caller passes both exact UTC midnight scalars, calendar,
largest and smallest units, increment and signed rounding mode. Both
engines reconstruct the date fields and zero time before rounding. Negating
the sign for since gives the same choice as rounding with the negated mode.
The fused day/increment-one path is on-grid with zero clock fields, so it
returns the unchanged date duration. This verifies caller transport for
the rounding step. CalendarDateUntil and nudge behavior retain their own
requirements.
[TypeScript dispatch](../../packages/temporal/plain-date.ts#L289).
[Rust dispatch](../../crates/temporal/plain_relative.rs#L125).
[Temporal comparison §3.5.14 step 8.e](https://tc39.es/proposal-temporal/#sec-temporal-differencetemporalplaindate).

- Failing borrowed-zone Bazel log SHA-256 `a2046568eb610a40d6d44c9712079a28c4a1ea3ce2ac3daa11a94ba8326d469f`
- Failing same-day Bazel log SHA-256 `114a46c49f496e185ec882ade0408ddeb47ba9bc8fea1c41c5ae24e2fb276f6f`
- Failing uncovered-origin Bazel log SHA-256 `744fd6d9152f9038a77749430e86d9b7b734a4275530245684d64a91d8feab78`
- Passing Rust, TypeScript and Hermes Bazel log SHA-256 `c3ff9ef95b71eebdeec8970b1bd1c8d9d6d668b6ce7301aecf243df3959bf330`

## Plain and zoned caller arguments

PlainDateTime clock borrow moves the end ISO day one day toward the start
only when the clock remainder opposes the date direction. Both engines pass
that day, the original ISO start day, calendar and largest date unit to
calendar difference. For time-largest units, the signed day adjustment
subtracts the same exact day that it adds to the clock remainder. The fused
epoch subtraction therefore gives the same result on the supplied
terminating day-difference contract. The published ISO loop issue remains
separate.
[TypeScript adjusted day](../../packages/temporal/date-core.ts#L872).
[Rust adjusted day](../../crates/temporal/calendar_difference.rs#L145).
[Temporal comparison §5.5.12 step 9](https://tc39.es/proposal-temporal/#sec-temporal-differenceisodatetime).

For unequal zoned instants and date-largest units, the public difference
passes both exact instants, the receiver's zone and calendar, both units,
increment and rounding mode. The FFI forwards the same values. Reversing
the result for since is equivalent to switching ceil with floor and
halfCeil with halfFloor under negation. Other modes are invariant under
that conjugation, including halfEven's absolute parity check.
[TypeScript dispatch](../../packages/temporal/zoned-date-time.ts#L647).
[Rust dispatch](../../crates/temporal/zoned_difference.rs#L51).
[Native dispatch](../../crates/temporal/ffi.rs#L1189).
[Temporal comparison §6.5.9 step 9](https://tc39.es/proposal-temporal/#sec-temporal-differencetemporalzoneddatetime).

The zoned rounding entry uses the unrounded fields after the time-unit
and exact-nanosecond exits. Both exact instants, the original base clock
and calendar, the zone, and the prepared rounding settings stay available
to the fused rounding path. Endpoint construction recovers the base clock
from the receiver. This verifies argument transport while the round
window, fold choice and published retry text stay separately governed.
[TypeScript rounding entry](../../packages/temporal/date-core.ts#L1003).
[Rust rounding entry](../../crates/temporal/calendar_difference.rs#L246).
[Temporal comparison §6.5.7 step 5](https://tc39.es/proposal-temporal/#sec-temporal-differencezoneddatetimewithrounding).

Zoned date-unit total uses the same exact endpoints, original receiver
and date-unit difference. The requested total unit is also the largest
unit, so no larger date field contributes a prefix. An unrounded week
difference has fewer than seven residual days. The fused window can use
the selected count with the exact endpoints to represent the remaining
fraction. Its endpoint retries and final quotient retain their separate
requirements.
[TypeScript total inputs](../../packages/temporal/relative-duration.ts#L206).
[Rust total inputs](../../crates/temporal/relative_duration.rs#L90).
[Temporal comparison §6.5.8 step 4](https://tc39.es/proposal-temporal/#sec-temporal-differencezoneddatetimewithtotal).

Nine focused Bazel targets pass across TypeScript, public Rust, FFI and
Hermes plain, zoned and duration paths.

- Passing Bazel log SHA-256 `371268cb3578192ae42c258e196c5653b13802650b8a60fd5b215b6898050a4b`

## Wide transitions and initial total validation

For a +23:00 to −23:00 fold, the origin is UTC hour 23 and the target
is hour 73. The one-, two- and three-day candidates are hours 47, 71
and 141. The initial and once-shifted windows both end before the target.
The former truncation returned `P1D`. The correct final bracket gives
`P2D` for truncation and nearest rounding, and `P3D` for ceil. The
reverse control uses a wide gap with target hour −20 and candidates
16, −8 and −32. It gives `-P2D` for truncation and half-even, and
`-P3D` for floor.

Both engines repeat the outward retry, while retaining an exact first
bound. A first bound past the target moves one stride inward. The
public replay also checks the existing borrowed Rust inward example
through the owned TypeScript host path. The two-day endpoint at hour
72 bounds target hour 61 from origin hour 24, so truncation gives
zero. Whole-window assertions stay conditional for the remaining
providers and published comparison.
[TypeScript retry](../../packages/temporal/date-core.ts#L1037).
[Rust retry](../../crates/temporal/calendar_difference.rs#L276).
[Public Rust fold](../../crates/temporal/lib.test.rs#L3895).
[Temporal comparison §7.5.34 steps 5–6 and 13–17](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit).

A Gregorian borrowed zone can put the first week endpoint at maximum
Instant minus 22 hours and the target at maximum Instant minus 23 hours.
The second week extends beyond the maximum. The former total moved
inward before validating that endpoint, returning `167/168`. Both
kernels now validate the first pair before retrying. The upper endpoint
throws and the total propagates the error.
[TypeScript initial endpoint](../../packages/temporal/relative-duration.ts#L215).
[Rust initial endpoint](../../crates/temporal/relative_duration.rs#L98).
[Public Rust total](../../crates/temporal/calendar.test.rs#L122).
[Temporal comparison §7.5.33 steps 8–12](https://tc39.es/proposal-temporal/#sec-temporal-computenudgewindow).

Seven Bazel targets pass across TypeScript, Rust, FFI and Hermes.
[Owned package replay](temporal-timezone-boundary-proof/owned-wide-rounding-replay.mjs).

- Failing Rust fold log SHA-256 `9442cc60f94f6dd6aac8425510caed13910d8fbb9f95e5e28c550c373ad717a2`
- Passing integration log SHA-256 `8c619151998ab2b63cf99c7b20bbd902f7abcceea34146afe735057a4e5fb932`
- Public package before-fix replay SHA-256 `faf2c1a065b4a48d397d75ec57c0fa11cdd65707c8b5afb7aff50e4ef85c3635`
- Public package passing replay SHA-256 `80e47e7d297a654a887aef69688e4ac361b69d492022bddcf65f1f30f239c0d5`

## Retained-week upper bound

A Gregorian borrowed zone changes from +16:00 to −20:00 at maximum
Instant minus 50 hours. The origin is maximum minus 1,131 hours and
`PT1082H` reaches maximum minus 49 hours. The unrounded month
difference is `P1M12DT50H`. The two-week upper endpoint is maximum
minus 51 hours and its later twin is maximum minus 15 hours. Both
candidates are valid. The three-week endpoint cannot be constructed.

The former retained-week shortcut returned `P1M3W` for ceil after
the first upper endpoint fell short. Both kernels now delegate that
case to the existing shared retry. The next endpoint is checked before
rounding proceeds. Exact first endpoints still perform the initial
validation. Lower-side retained-prefix behavior and the separate
published window assertions remain open.
[TypeScript retained-week branch](../../packages/temporal/relative-duration.ts#L289).
[Rust retained-week branch](../../crates/temporal/relative_duration.rs#L166).
[Public Rust regression](../../crates/temporal/calendar.test.rs#L168).
[Temporal comparison §7.5.34 steps 5–6 and §7.5.38 step 5.a](https://tc39.es/proposal-temporal/#sec-temporal-roundrelativeduration).

The assembled owned replay reproduces the invalid duration before the
fix and the range error afterward. Twelve integrated Bazel targets pass.
[Public package replay](temporal-timezone-boundary-proof/owned-wide-rounding-replay.mjs).

- Before-fix replay SHA-256 `35a679ab728f216ad2601b1c9db82acf8d6057c19b1408ddce0878c10963a17a`
- Passing replay SHA-256 `9e90d0ae0ad3e0f1bf3b2c5c89f246626cabdc36cf21d28a1429ef1840970d03`
- Integration log SHA-256 `32cf9982daabbf211fba8cee9c28e6b83668d4140e656afc68cd8a1e742ca2df`
