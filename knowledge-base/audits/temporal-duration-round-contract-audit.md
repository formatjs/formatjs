# Duration.round contract comparison

Reviewed 2026-11-22. Maps public preparation, dispatch and result construction;
not complete method signoff. Requested [ECMA-262](https://tc39.es/ecma262/)
snapshot lacks Temporal API chapters. Numbered steps below refer only to
separately published [proposal comparison §7.3.20](https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.round).
They do not replace requested authority. Historical index entries remain
navigation evidence; no trace credit added.

Source anchors include the week-window correction below.

## Public steps

| Compared step                     | Source and result                                                                                                                                                                                                                                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–2 receiver/brand                | [duration.ts:254](../../packages/temporal/duration.ts#L254), [read:82](../../packages/temporal/duration.ts#L82): private slot lookup before options; invalid receiver throws captured TypeError.                                                                                                            |
| 3 required argument               | [duration.ts:256](../../packages/temporal/duration.ts#L256): undefined rejects before property access.                                                                                                                                                                                                      |
| 4.a–c String shorthand            | [duration.ts:261](../../packages/temporal/duration.ts#L261), [unitOptions:75](../../packages/temporal/rounding.ts#L75): primitive String retained; null-prototype record, own smallestUnit property.                                                                                                        |
| 5 options object                  | [optionsObject:68](../../packages/temporal/rounding.ts#L68): retain object; reject null/non-String primitives; no cloning/enumeration.                                                                                                                                                                      |
| 6–7 presence flags                | [duration.ts:265](../../packages/temporal/duration.ts#L265): raw undefined marks absent largestUnit; absent smallestUnit retained separately from its eventual default.                                                                                                                                     |
| 8–9 largestUnit                   | [duration.ts:265](../../packages/temporal/duration.ts#L265): Get, ToString, validate/normalize before relativeTo. Explicit auto counts as present; invalid value stops subsequent reads.                                                                                                                    |
| 10–12 relativeTo                  | [duration.ts:269](../../packages/temporal/duration.ts#L269), [toRelativeTo:67](../../packages/temporal/relative-duration.ts#L67): complete preparation before increment Get; private-slot, string and property-bag routes.                                                                                  |
| 13 increment                      | [duration.ts:270](../../packages/temporal/duration.ts#L270), [roundingIncrement:109](../../packages/temporal/rounding.ts#L109): Get, immediate ToNumber/truncation, finite integer 1..1e9; default 1.                                                                                                       |
| 14 mode                           | [duration.ts:271](../../packages/temporal/duration.ts#L271), [roundingMode:83](../../packages/temporal/rounding.ts#L83): Get, ToString, nine-mode validation; default halfExpand.                                                                                                                           |
| 15–16 smallest/category           | [duration.ts:272](../../packages/temporal/duration.ts#L272), [unitOption:93](../../packages/temporal/rounding.ts#L93): Get/ToString; exact singular/plural normalization to closed datetime-unit list.                                                                                                      |
| 17 smallest default               | [duration.ts:287](../../packages/temporal/duration.ts#L287): absent becomes nanosecond; presence remains absent.                                                                                                                                                                                            |
| 18 existing largest               | [largestDurationField:241](../../packages/temporal/duration-core.ts#L241): indexed first nonzero field, zero falls back to nanosecond.                                                                                                                                                                      |
| 19 default largest                | [duration.ts:289](../../packages/temporal/duration.ts#L289): earlier of existing largest and smallest in year..nanosecond order.                                                                                                                                                                            |
| 20–21 unset/auto largest          | [duration.ts:267](../../packages/temporal/duration.ts#L267): both use derived default; only unset counts absent.                                                                                                                                                                                            |
| 22 units required                 | [duration.ts:273](../../packages/temporal/duration.ts#L273): both absent rejects after independent option preparation. Explicit auto alone remains present.                                                                                                                                                 |
| 23 unit order                     | [duration.ts:293](../../packages/temporal/duration.ts#L293): largest cannot be smaller than smallest.                                                                                                                                                                                                       |
| 24–25 increment maximum           | [duration.ts:298](../../packages/temporal/duration.ts#L298): clock maxima 24/60/60/1000/1000/1000; strict cap and divisor. Date units have no fixed cap.                                                                                                                                                    |
| 26 date increment coupling        | [duration.ts:303](../../packages/temporal/duration.ts#L303): date smallest with larger largest requires increment 1.                                                                                                                                                                                        |
| 27.a–h zoned                      | [duration.ts:307](../../packages/temporal/duration.ts#L307), [relativeRound:228](../../packages/temporal/relative-duration.ts#L230): actual zoned target, required rounding difference, fresh result; native dispatch precedes TS arithmetic. Special week route correction below validates both endpoints. |
| 28.a–j plain                      | [relativeRound:246](../../packages/temporal/relative-duration.ts#L248): midnight origin, constrained calendar add and clock carry, rounded plain difference. Plain equal-endpoint shortcut has its own contract.                                                                                            |
| 29 no-relative calendar rejection | [duration.ts:316](../../packages/temporal/duration.ts#L316): nonzero years/months/weeks or calendar largest rejects. Native earlier dispatch owns equivalent validation.                                                                                                                                    |
| 30 smallest not calendar          | [duration.ts:293](../../packages/temporal/duration.ts#L293): order plus largest calendar rejection implies this assertion.                                                                                                                                                                                  |
| 31 normalize 24h days             | [duration.ts:325](../../packages/temporal/duration.ts#L325): exact BigInt days/time sum; no calendar fields survive.                                                                                                                                                                                        |
| 32 day rounding                   | [duration.ts:318](../../packages/temporal/duration.ts#L318): exact increment×24h quantum; equivalent to mathematical fractional-day rounding without premature Number conversion.                                                                                                                           |
| 33 clock rounding                 | [duration.ts:321](../../packages/temporal/duration.ts#L321), [roundDuration:204](../../packages/temporal/rounding.ts#L204): exact signed integer quantum/modes.                                                                                                                                             |
| 34 create result                  | [duration.ts:322](../../packages/temporal/duration.ts#L322), [createDuration:122](../../packages/temporal/duration.ts#L122): balance requested leading field, validate magnitude/signs, fresh intrinsic-prototype object.                                                                                   |

## Caller paths and observable order

Reads/conversions occur in order: largestUnit; relativeTo with full preparation;
roundingIncrement; roundingMode; smallestUnit. Each abrupt completion stops
later accesses. Cross-option checks follow all independent reads. Zero/exact
values do not bypass preparation. Helper audits provide selected coercion and
preparation evidence; this review did not execute a complete five-option abrupt
completion matrix.

With relativeTo, [relativeRound:236](../../packages/temporal/relative-duration.ts#L238)
selects native dispatch or obtains the actual endpoint before branching.
[Native adapter:1034](../../packages/temporal/native.ts#L1072) receives prepared
fields/unit/anchor; typed Rust does not implement JS coercion. Without relativeTo,
[duration.ts:311](../../packages/temporal/duration.ts#L311) selects native or fixed
24h arithmetic after public validation.

Special year/month-to-week handling runs before normal plain/zoned rounding.
Other zoned calls pass isDurationRounding=true to
[differenceZonedDuration](../../packages/temporal/zoned-date-time.ts#L572).
That flag prevents the public ZonedDateTime.until equal-epoch shortcut from
intercepting Duration.round. Plain equality follows
[comparison §5.5.13](https://tc39.es/proposal-temporal/#sec-temporal-differenceplaindatetimewithrounding);
zoned Duration rounding follows
[comparison §6.5.7](https://tc39.es/proposal-temporal/#sec-temporal-differencezoneddatetimewithrounding).
A shared helper's zero behavior alone cannot establish either public caller.

## Exact week-window correction

The [special week branch:249](../../packages/temporal/relative-duration.ts#L251)
and [Rust counterpart:124](../../crates/temporal/relative_duration.rs#L125)
previously returned when the first endpoint equaled the target, before validating
the next week endpoint. That bypassed
[comparison §7.5.33 ComputeNudgeWindow](https://tc39.es/proposal-temporal/#sec-temporal-computenudgewindow)
and [§7.5.34 NudgeToCalendarUnit](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit).

Independent boundary witnesses retain nonzero month prefixes:

- P1M1W from +275760-08-06 reaches September13; its next week reaches
  September20, outside the supported range.
- -P1M1W from -271821-05-27 reaches April20; its next negative week reaches
  April13, outside the supported range.

Both plain and UTC-zoned nonzero exact-week paths require the complete window.
Nanosecond/increment 1 controls must preserve the exact duration. Zoned zero at
maximum Instant also needs a positive next-week endpoint; plain zero can retain
its equality shortcut. Both implementations now validate the second endpoint
before returning exact results, restore the retained week count, and choose
positive direction for zoned zero. Plain equal endpoints retain their shortcut.

Public regressions failed in both TS and native Hermes before correction. Ten
shared assertions cover four boundary rejections, four nanosecond controls and
the distinct plain/zoned zero cases. All seven focused Rust/TS/native/compiler
gates pass. Expanded matrix: all 67 tests pass, including all 40 Temporal
class/backend gates, five Now backends and six Rust consumer suites. Both
Temporal and DurationFormat package assemblies pass. Matrix targets remain in
[validation manifest](temporal-day-window-validation-targets.txt).

## Precision and remaining dependencies

Fixed-unit input nanoseconds stay BigInt until rounded output field conversion.
Calendar count exactness depends on shipped calendar bounds and correct
unrounded decomposition. Week interpolation combines integer count and endpoint
residual before rounding; calendar prefix, endpoint validity and positive span
remain prerequisites. Existing shared checker covers 51,840 plain and 19,440 zoned
rounding fixture rows; counts do not establish every caller shortcut or option
branch. The step map itself adds no exhaustive option-order test claim.

Still open: complete relativeTo conversion; CalendarDateAdd/Until and normalized
record conversion; endpoint/window progress and calendar bubbling; skipped and
repeated dates including documented proposal inconsistencies; provider/native
adapter contracts; all receiver/realm/allocation and abrupt-completion cases.
No complete Duration.round signoff follows.

Relevant numbered ECMA-262 dependencies:
[§10.1.15 RequireInternalSlot](https://tc39.es/ecma262/#sec-requireinternalslot),
[§10.1.12 OrdinaryObjectCreate](https://tc39.es/ecma262/#sec-ordinaryobjectcreate),
[§7.3.6 CreateDataPropertyOrThrow](https://tc39.es/ecma262/#sec-createdatapropertyorthrow),
[§7.3.2 Get](https://tc39.es/ecma262/#sec-get-o-p),
[§7.1.1 ToPrimitive](https://tc39.es/ecma262/#sec-toprimitive),
[§7.1.4 ToNumber](https://tc39.es/ecma262/#sec-tonumber),
[§7.1.19 ToString](https://tc39.es/ecma262/#sec-tostring).
