# BubbleRelativeDuration comparison

Body review, 2026-11-22. Historical ledger leaves pinned
source 1814–1845 open; existing day-window/rounding audits explicitly leave bubbling
as a dependency. Requested [ECMA-262](https://tc39.es/ecma262/) snapshot has no
Temporal API chapters. Numbered steps below refer only to separately published
[proposal comparison §7.5.37](https://tc39.es/proposal-temporal/#sec-temporal-bubblerelativeduration),
not substituted authority or complete caller signoff.

## Entry contract and public reachability

Compared [§7.5.38 step9](https://tc39.es/proposal-temporal/#sec-temporal-roundrelativeduration)
bubbles only after a nudge reports expansion, with smallestUnit replaced by the
larger of actual smallest and day; week smallest unit excludes bubbling. TS
[date-core.ts:1040](../../packages/temporal/date-core.ts#L1073) and Rust
[calendar_difference.rs:302](../../crates/temporal/calendar_difference.rs#L377)
use expanded && smallest!=week and min(smallestIndex,dayIndex). This reproduces
entry-unit selection; it does not prove every producer sets expanded correctly.

AST call inventory finds exactly two TS calls to roundRelativeDifference:

- [date-core.ts:844](../../packages/temporal/date-core.ts#L847), through
  roundedDateTimeDifference. Public callers: PlainDate.until/since
  [plain-date.ts:277](../../packages/temporal/plain-date.ts#L277),
  PlainDateTime.until/since
  [plain-date-time.ts:322](../../packages/temporal/plain-date-time.ts#L322),
  PlainYearMonth.until/since
  [plain-year-month.ts:260](../../packages/temporal/plain-year-month.ts#L260),
  and plain-relative Duration.round
  [relative-duration.ts:305](../../packages/temporal/relative-duration.ts#L311).
- [zoned-date-time.ts:628](../../packages/temporal/zoned-date-time.ts#L628), through
  differenceZonedDuration. Public ZonedDateTime.until/since and zoned-relative
  Duration.round [relative-duration.ts:281](../../packages/temporal/relative-duration.ts#L283).

Presence on this call graph does not guarantee bubbling: time largest unit returns
before date bubbling; zoned nanosecond/increment 1 returns unrounded; no expansion skips
bubble; week smallest unit skips bubble; largest==effective smallest executes no loop.
Duration.round's year/month-to-week special route bypasses this engine and is
covered by the separate exact-week correction. Duration.total does not call this bubble loop.

Rust typed public date/date-time/zoned differences and relative Duration rounding
share calendar_difference::difference. Native JS round routes enter typed Rust
through native.ts roundDuration/difference operations. Typed parity covers
arithmetic structure, not JS coercion, public option order or complete adapters.

## Numbered comparison map

TS anchor: [date-core.ts:1039–1054](../../packages/temporal/date-core.ts#L1072).
Rust anchor: [calendar_difference.rs:302–318](../../crates/temporal/calendar_difference.rs#L377).
The effective smallest index below already includes the caller's day cap.

| Compared step                | TS                        | Rust                           | Result / premise                                                                                                            |
| ---------------------------- | ------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 1 equal largest/smallest     | 1041                      | 303–305                        | Initial index smaller than largest; zero iterations returns existing duration. No endpoint/provider call.                   |
| 2 largest index              | existing largeIndex891    | largest enum ordinal           | Canonical unit order year,month,week,day,hour..nano. Validated before this block.                                           |
| 3 smallest index             | min(smallIndex,3)1041     | min(smallest,Day)303           | Caller passes larger of smallest/day; same ordinal selection.                                                               |
| 4 previous unit              | 1041 initial−1            | 305 decrement                  | Visit immediately larger unit first.                                                                                        |
| 5 done=false                 | loop/break                | loop/break                     | No separate boolean needed.                                                                                                 |
| 6 loop bounds                | 1041                      | 304                            | Stops after largest index or first failed boundary.                                                                         |
| 6.a unit selection           | differenceUnits1045,1048  | enum-index fields311           | Same year/month/week candidates only; effective smallest never smaller than day.                                            |
| 6.b week filter              | 1042                      | 306–307                        | Week included only when requested largest unit is week. Year/month balancing does not introduce weeks.                      |
| 6.b.i.1 year count           | 1048–1049                 | 311                            | Existing years+physical sign. Validated bounded count premise.                                                              |
| 6.b.i.2 year record          | 1043–1049                 | 309–311                        | Fresh zero fields; index0 increment; month/week/day/time allzero.                                                           |
| 6.b.ii.1 month count         | 1048–1049                 | 311                            | Existing months+physical sign.                                                                                              |
| 6.b.ii.2 month record        | 1043–1049                 | 309–311                        | Preserve year prefix; replace month; zero week/day/time.                                                                    |
| 6.b.iii.1 week assertion     | 1041–1042                 | 303–307                        | Only remaining candidate isweek. Day/time never visited.                                                                    |
| 6.b.iii.2 week count         | 1048–1049                 | 311                            | Existing weeks+physical sign.                                                                                               |
| 6.b.iii.3 week record        | 1043–1049                 | 309–311                        | Preserve year/month prefix; replace week; zero day/time.                                                                    |
| 6.b.iv CalendarDateAdd       | anchor.endpoint1050       | endpoint312                    | Original anchor, constrained date addition. Delegation contract below.                                                      |
| 6.b.v combine original clock | anchor.endpoint1050       | endpoint312                    | Original clock retained by endpoint closure; never sequential add from a gap-shifted candidate.                             |
| 6.b.vi–vi.1 plain epoch      | date-core endpoint855–860 | PlainAnchor::endpoint          | Convert combined plain ISO date/time to exact integer epoch coordinate. Complete local-range delegation remains open.       |
| 6.b.vii–vii.1 zoned epoch    | zoned endpoint640         | Zoned RelativeAnchor::endpoint | Resolve original local clock/date compatibly through addZonedDuration / checked_add. Full gap/fold/provider proof separate. |
| 6.b.viii difference          | 1051                      | 313                            | Exact roundedEpoch−candidateEpoch.                                                                                          |
| 6.b.ix difference sign       | 1051 multiplication       | 313 multiplication             | Integer sign comparison fused with physical sign. Equality remains zero.                                                    |
| 6.b.x crossing predicate     | 1051                      | 313                            | Break iff delta*sign<0. For sign ±1, equivalent to sign(delta)==−sign. Equality counts reached.                             |
| 6.b.x.1 replace duration     | 1052                      | 316                            | Replace entire fields with candidate; clock zero, higher prefix preserved. Does not append candidate to old time remainder. |
| 6.b.xi–xi.1 not reached      | break1051                 | break314                       | Stop all larger-unit bubbling, not merely current unit.                                                                     |
| 6.c decrement                | for decrement1041         | 305 at iteration start         | Exactly one signed candidate per larger unit; no repeated count increment for same unit.                                    |
| 7 return                     | result1052 then1061       | fields316 then324              | Caller may subsequently negate for since; physical bubbling itself uses original origin-to-target sign.                     |

## Endpoint and precision proof boundaries

TS plain endpoint closure
[date-core.ts:855](../../packages/temporal/date-core.ts#L858) adds constrained
calendar fields to original date, multiplies resulting epoch day by exact
nsPerDay, then adds original timeOf(start). Zoned closure
[zoned-date-time.ts:639](../../packages/temporal/zoned-date-time.ts#L639) calls
addZonedDuration on original slot. Candidate has no clock fields, so date
addition uses original local clock and compatible resolution. Rust
zoned_difference.rs RelativeAnchor::endpoint delegates original receiver's
checked_add; plain_relative.rs supplies corresponding plain anchor.

All candidate and rounded epoch arithmetic remains BigInt/i128. Sign comparison
cannot lose nanoseconds. TS count+sign uses Number fields; sufficient exactness
comes from existing built-in calendar count bounds, not arbitrary provider
counts. Rust bounded i128 counts and epoch delta fit the documented built-in
domain; arbitrary provider overflow is not proved here.

Errors constructing candidate date, resolving zone or validating epoch propagate
before the crossing comparison, even when the candidate would be beyond rounded
endpoint. Comparison likewise resolves candidate before checking it. No upper
candidate-range shortcut is justified by expected failure to cross. Full
CalendarDateAdd/GetEpochNanosecondsFor/GetUTCEpochNanoseconds and padded local
range behavior remain dependencies.

## Findings and useful independent controls

No direct bubble-body mismatch established. Conditional mapping covers every
compared branch, including equality, negative sign, skipped week, prefix retention
and stopping at first failed boundary. Existing fixture totals do not prove each
bubble branch was reached; no branch-coverage claim made.

Meaningful public controls, if absent from owning shared checker:

- Origin 2020-01-31T00:00, target 2020-02-28T23:40; largestmonth,
  smallesthour/ceil. Rounded leap-day boundary equals origin+1month; expect P1M.
- Origin 2020-03-31T00:00, target 2020-02-29T00:20; largestmonth,
  smallesthour/floor. Rounded endpoint equals origin−1month; expect −P1M.
- Origin 2020-01-01T00:00, target 2020-01-07T23:40; smallesthour/ceil.
  Largestyear must retain P7D; largest unit is week may produce P1W. This distinguishes week
  suppression from week promotion.

These expectations follow literal ISO leap-year/date boundaries and signed hour
rounding, not production bubble helper. No tests run or new regressions claimed.
Before adding controls, inspect existing independent arithmetic/relative fixtures
for these exact branch witnesses to avoid duplication.

Remaining operation signoff dependencies: authoritative Temporal chapter choice;
expanded/nudgedEpoch correctness in all nudge producers; normalized duration
invariants/count bounds; all original-anchor calendar/zone endpoints and their
ranges; caller option/native/realm contracts; existing Casey/Apia specification
issues. No complete caller or method compliance follows from this local body map.
