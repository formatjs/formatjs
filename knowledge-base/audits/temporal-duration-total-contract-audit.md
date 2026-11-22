# Duration.total contract map

Reviewed 2026-11-21. The requested ECMA-262 snapshot lacks Temporal API chapters.
[Published §7.3.21](https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.total)
and other Temporal references here are comparison only. This map covers every
public step and the relative-total branches; dependencies remain explicit.
No historical algorithm-line credit or complete operation signoff.

## Public steps

| Comparison step    | Source                                                                                                                   | Evidence / remaining obligation                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–2 brand          | [duration.ts:333](../../packages/temporal/duration.ts#L333)                                                              | Private brand read precedes options. Complete realm/foreign receiver contract remains separate.                                                                             |
| 3 undefined        | [335](../../packages/temporal/duration.ts#L335)                                                                          | Captured TypeError before option reads.                                                                                                                                     |
| 4 string shorthand | [340](../../packages/temporal/duration.ts#L340)                                                                          | Primitive unit string retained in fresh null-prototype options with own unit. Existing unit-option audit owns allocation proof.                                             |
| 5 object options   | [343](../../packages/temporal/duration.ts#L343)                                                                          | Object retained without enumeration; invalid primitives reject.                                                                                                             |
| 6–9 relativeTo     | [344](../../packages/temporal/duration.ts#L344), [preparation:67](../../packages/temporal/relative-duration.ts#L67)      | Complete relative preparation precedes unit Get. Branded date/date-time/zoned slots bypass public fields; string/bag parsing remains a full dependency.                     |
| 10 unit conversion | [345](../../packages/temporal/duration.ts#L345)                                                                          | Required unit, exact singular/plural normalization; abrupt relative preparation prevents this Get.                                                                          |
| 11 unit category   | [346](../../packages/temporal/duration.ts#L346)                                                                          | Closed ten-unit datetime list; omitted/unknown unit rejects.                                                                                                                |
| 12 zoned relative  | [347](../../packages/temporal/duration.ts#L347), [relativeTotal:143](../../packages/temporal/relative-duration.ts#L143)  | Native dispatch or exact added endpoint, elapsed time total or recomputed calendar/day window. Full addition/provider contract remains prerequisite.                        |
| 13 plain relative  | Same dispatch, [169](../../packages/temporal/relative-duration.ts#L169)                                                  | Midnight anchor, constrained calendar addition plus elapsed clock carry. Fixed-unit shortcut preserves date/span checks. Calendar-provider equivalence remains conditional. |
| 14 no relative     | [348](../../packages/temporal/duration.ts#L348)                                                                          | Native dispatch or reject calendar fields/calendar target; days are 24 hours. Sum remains BigInt through final division.                                                    |
| 15 Number          | [367](../../packages/temporal/duration.ts#L367), [relative ratio:225](../../packages/temporal/relative-duration.ts#L225) | One correctly rounded binary64 ratio. Existing private-ratio proof requires valid endpoints, positive span and bounded exact count.                                         |

## Relative branch obligations

[Native dispatch:148](../../packages/temporal/relative-duration.ts#L148) receives
prepared primitive fields/relative anchor/unit. Rust backend shares endpoint and
window arithmetic; Rust value parity does not prove JS property-access behavior.

[Zero policy:161](../../packages/temporal/relative-duration.ts#L161) returns positive
zero for plain anchors and zoned time units. Zoned calendar/day totals reach the
positive next-endpoint window, including at Instant limits. The removed sequential
day preflight was not equivalent to that window across gaps; see the
[confirmed witness and correction](temporal-day-window-engine-audit.md).

[Plain fixed-unit shortcut:169](../../packages/temporal/relative-duration.ts#L169)
requires no year/month fields and no calendar target unit. Weeks become seven
days, days 24 hours; exact duration-span and final epoch-day checks remain. Its
equivalence to arbitrary CalendarDateAdd providers is not proved.

[Full endpoint:186](../../packages/temporal/relative-duration.ts#L186) uses
relativeEndpoint: zoned calendar addition/resolution then elapsed clock; plain
calendar date plus clock with range/span checks. Fixed targets divide end−start
by a positive constant. Zoned day and calendar targets continue to unrounded
calendar difference using the requested largest unit.

[Window:200](../../packages/temporal/relative-duration.ts#L200) zeroes larger fields,
sets the requested count, backs off overshoot and computes count+sign before an
exact-match return. Subsequent loop advances past reached/collapsed endpoints.
Both sides always derive from the original anchor. Full equivalence to comparison
[§7.5.34](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit)
and [§7.5.39](https://tc39.es/proposal-temporal/#sec-temporal-totalrelativeduration)
requires provider progress, unrounded decomposition and skipped-date retry policy;
existing Apia spec issue remains unresolved.

[Fraction:224](../../packages/temporal/relative-duration.ts#L224): with sign ±1,
span=(b−a)×sign must be positive. Result is
(count×span + end−a)/span, computed exactly before final Number conversion.
For negative direction, count and residual are negative. Under validated shipped
endpoint/count bounds, TS BigInt stays exact and Rust numerator fits i128. No
claim covers arbitrary provider counts or nonprogressing windows.

## Evidence and limits

Existing shared oracle checks 17,280 plain relative totals and 6,480 zoned totals,
option ordering and malformed relatives. Exact/zero calendar boundary controls
protect required next endpoints. New legal transition-provider control verifies
47/46 after gap resolution; shared UTC controls preserve zero-day rejection.
Owning focused Rust, relative-duration and oracle tests pass after correction.
Expanded backend validation belongs to the linked day-window audit.

Remaining: complete GetTemporalRelativeToOption, CalendarDateAdd/Until and
AddZonedDateTime contracts; provider progress/ranges, collapsed/repeated civil
windows, native transport, complete public coercion and realms. A mapped step
with an open dependency is not a completed step contract.
