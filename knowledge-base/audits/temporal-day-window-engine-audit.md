# Zoned difference and Duration day windows

Reviewed 2026-11-21. Requested ECMA-262 has no Temporal API chapters in the checked
snapshot. Numbered Temporal references below are official published proposal
comparison only; no API completion or historical trace credit.

## Confirmed defects

A Duration-specific preflight added its calendar fields, resolved a gap, then
added another day to that resolved ZonedDateTime. Resolution can shift its clock;
the second addition then validates an unrelated endpoint. Valid totals/rounds
could reject. Shared rounding separately skipped required windows for zero
Duration rounding or unchanged rounded time. The compensating preflight also rejected
Duration nanosecond identity, whose comparison algorithm needs no window.

Gap total, three gap round profiles, exact-minute bound difference and Duration
nanosecond identity reproduce failures before correction. A separate
public TS fold control reproduces missing day carry. Public equality is a caller
shortcut, distinct from Duration rounding, and has its own preservation controls.

## Operation correspondence

| Published comparison                                                                                                                                                                          | Source                                                                                                                           | Change / retained obligation                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [§6.5.7 steps 1–3](https://tc39.es/proposal-temporal/#sec-temporal-differencezoneddatetimewithrounding)                                                                                       | [TS:905](../../packages/temporal/date-core.ts#L905), [Rust:179](../../crates/temporal/calendar_difference.rs#L179)               | Largest time retains exact epoch-difference rounding. Largest date computes unrounded fields. Smallest nanosecond/increment 1 returns those fields without a nudge; since negates once.                                                               |
| §6.5.7 steps 4–5                                                                                                                                                                              | [TS:935](../../packages/temporal/date-core.ts#L935), [Rust:203](../../crates/temporal/calendar_difference.rs#L203)               | Other internal zoned date-largest calls continue through shared nudge, including zero Duration rounding. Plain zero shortcut remains.                                                                                                                 |
| [§7.5.38 steps 1–7](https://tc39.es/proposal-temporal/#sec-temporal-roundrelativeduration)                                                                                                    | [TS shared engine:881](../../packages/temporal/date-core.ts#L881), [Rust:168](../../crates/temporal/calendar_difference.rs#L168) | Zero uses positive sign. Calendar/zoned-day smallest units take irregular branch; other zoned smallest units take time branch. Existing retry/bubbling logic remains separately bounded.                                                              |
| [§7.5.35 steps 1–6](https://tc39.es/proposal-temporal/#sec-temporal-nudgetozonedtime)                                                                                                         | [TS:995](../../packages/temporal/date-core.ts#L995), [Rust:258](../../crates/temporal/calendar_difference.rs#L258)               | Date-only copies of recomputed difference fields resolve base and next date through original anchor and original clock. Both endpoints are checked and day carry runs even if rounding leaves the time quantity unchanged. Date fields remain intact. |
| [§6.5.9 step 8](https://tc39.es/proposal-temporal/#sec-temporal-differencetemporalzoneddatetime)                                                                                              | [TS:606](../../packages/temporal/zoned-date-time.ts#L606), [Rust:44](../../crates/temporal/zoned_difference.rs#L44)              | Public until/since return zero for equal epochs after settings/calendar/zone validation. Internal Duration rounding bypasses this public shortcut; native Duration routing stays separate.                                                            |
| [§6.5.8 steps 2–4](https://tc39.es/proposal-temporal/#sec-temporal-differencezoneddatetimewithtotal), [§7.5.39 step 1](https://tc39.es/proposal-temporal/#sec-temporal-totalrelativeduration) | [TS total:143](../../packages/temporal/relative-duration.ts#L143), [Rust:7](../../crates/temporal/relative_duration.rs#L7)       | Remove unrelated preflight. Zoned zero-day total reaches normal positive window. Time-unit zero totals retain shortcut. Existing exact calendar totals still validate next endpoint.                                                                  |

Duration rounding delegates required validation to the shared engine. Its removed
preflight no longer duplicates calendar/provider work using a shifted clock.
New checks apply to direct ZonedDateTime differences as well as Duration callers.
No epoch Number conversion, BigInt arithmetic, rational conversion or unit quantum
changes. Supported ranges stay enforced by actual required endpoints.

## Legal transition witness

Let M = 8640000000000000000000 ns (maximum Instant), D = 86400000000000 ns.
Use a valid TransitionZone: initial offset +01:45, one transition at
M − D + 15 minutes to +02:45. All offsets/transition coordinates satisfy the
public provider constructor. Origin O = M − 2D + 45 minutes has local clock 02:30.

Adding one day targets next date's 02:30 gap; compatible resolution shifts to
03:30, yielding A = M − D + 45 minutes. P1DT30M ends at
F = M − D + 75 minutes. Required next window endpoint adds two days from original
02:30, giving B = M − 15 minutes. A, F and B are valid; B − A = 23 hours.
Total is 1 + 30 minutes / 23 hours = 47/46, finally rounded once to binary64
1.0217391304347827. HalfExpand day yields P1D; ceil yields P2D; minute rounding
retains P1DT30M.

Old preflight adds a day from shifted 03:30, yielding M + 45 minutes and rejecting.
[Literal endpoint controls:3660](../../crates/temporal/lib.test.rs#L3660) verify
these coordinates independently of total/round outputs. This is a valid typed
transition provider witness; no claim that a shipped IANA zone has this transition
at the extreme year.

## Unchanged-time carry across a fold

New York 2020-10-31T01:30-04:00 to 2020-11-01T01:00-05:00 spans 24h30m.
Unrounded difference is PT24H30M. The next original-clock endpoint is the first
Nov 1 01:30, only 24 hours after start. Minute rounding does not change the time
quantity, but §7.5.35 steps 11–15 still carry one date day and leave 30 minutes:
P1DT30M (since: -P1DT30M). Nanosecond/increment 1 returns the unrounded difference
before nudge, retaining PT24H30M (since: -PT24H30M). [Literal-epoch shared controls:201](../../packages/temporal/tests/zoned-arithmetic-oracle.ts#L201)
cover all four results. The separate calendar/day-total retry issue remains open.

## Boundary controls and limits

[Ten public Rust tests:3646](../../crates/temporal/lib.test.rs#L3646) independently
cover witness endpoints, total, three round profiles, public zero/day and
zero/minute equality, Duration zero window checks, invalid increments, exact-minute
maximum difference, and nanosecond identity.
Until/since preserve positive/negative one minute on the nanosecond path.

[Shared zoned arithmetic controls:226](../../packages/temporal/tests/zoned-arithmetic-oracle.ts#L226)
exercise UTC maximum Instant and one minute
before it across TS/native public routes. Duration zero/day and zero/minute rounding and exact-minute until/since reject
when next day is out of range. Public zero differences still succeed after
validation; invalid increments reject. Zero day total still rejects.
Nanosecond/increment 1 zero and exact differences succeed;
Duration zero nanosecond round succeeds. ICU fixture contents/counts stay intact.

Full shared-engine proof remains open: skipped/repeated-date retry, collapsed
windows, calendar bubbling, provider query/reentrancy contracts, calendar add/until
and range/realm behavior. Existing Apia and Casey spec issues remain separate. The
[reverse-fold intermediate tension](temporal-reverse-fold-spec-issue.md) also
keeps complete unrounded/endpoint equivalence open.
These controls prove the repaired branches, not every timezone/provider contract.

## Validation

Six Rust failure profiles and the TS fold failure reproduced. Corrected
Rust public, TS relative-duration/oracle/compiler and TS/native shared-boundary
gates: all seven pass (five executed, two cached). Final expanded matrix: all 67 tests pass (59 executed, eight cached), including
all 40 Temporal class/backend gates, five Now backends, six Rust consumer suites,
shared TS/native oracles and host consumers. Both Temporal and DurationFormat
package assemblies pass. No baseline, exclusions, fixture counts or timeout
settings change.

Reproducible expanded matrix:

```bash
bazel test --target_pattern_file=knowledge-base/audits/temporal-day-window-validation-targets.txt --test_output=errors
```

The manifest lists backend tests, six Rust consumer tests, owning oracles and both
package assembly targets. It preserves existing suite definitions and exclusions.
