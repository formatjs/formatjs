# PlainYearMonth add and subtract contract

Reviewed 2026-11-22. Requested [ECMA-262](https://tc39.es/ecma262/) snapshot lacks
Temporal API chapters. The separately rendered
[proposal §9.3.14 add](https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype.add),
[§9.3.15 subtract](https://tc39.es/proposal-temporal/#sec-temporal.plainyearmonth.prototype.subtract)
and [§9.5.8 AddDurationToYearMonth](https://tc39.es/proposal-temporal/#sec-temporal-adddurationtoyearmonth)
are comparison/navigation only. No authoritative Temporal completion or
historical line credit follows. Source anchors identify corrected code.

Current code: [TS helper137](../../packages/temporal/plain-year-month.ts#L137),
[public methods316](../../packages/temporal/plain-year-month.ts#L316),
[Rust addition171](../../crates/temporal/short_dates.rs#L171),
[native adapter645](../../packages/temporal/native.ts#L645) and
[FFI dispatch929](../../crates/temporal/ffi.rs#L929).

## Complete compared operation

| Compared step                         | TS                                                        | Rust/native                                                      | Assessment                                                                                                                                                    |
| ------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public add/subtract1–2 receiver/brand | plain-year-month.ts:312/315 invokes read108 before helper | Typed PlainYearMonth; JS frontend validates before native        | No public duration/options reads before brand check.                                                                                                          |
| Public step3 delegate                 | add137, sign+1/-1                                         | short_dates.rs:171/190                                           | Same helper; subtract negates duration once.                                                                                                                  |
| 1 duration conversion                 | toDurationFields or toNativeDurationFields145             | FFI929 receives serialized validated fields                      | Slots/string/field-bag conversion shared with Duration. Full conversion proof remains separately owned.                                                       |
| 2 subtraction                         | indexed canonical field scan152                           | checked_subtract191 then checked_add                             | Correct value negation; private Object.keys lookup removed.                                                                                                   |
| 3 internal duration                   | complete Duration fields already supplied                 | Duration new/negated then fields172                              | No days/time balancing: representation remains separate.                                                                                                      |
| 4 options object                      | overflowOption154 uses optionsObject                      | JS evaluates before native add call150; typed Rust receives enum | Public GetOptionsObject ordering preserved conditional on shared helper.                                                                                      |
| 5 overflow                            | overflowOption154                                         | FFI overflow() before checked_add                                | Reads overflow once after duration conversion and subtraction.                                                                                                |
| 6 date part                           | existing years/months/weeks/days fields                   | DateDuration conversion179–183                                   | Private field extraction.                                                                                                                                     |
| 7 unsupported components              | checks weeks/days/all six clock fields155–166             | fields[2..] nonzero173                                           | Explicit published restriction. Day/week/time rejection is correct; no historical sign-dependent anchor rule should be introduced.                            |
| 8 calendar                            | slot.calendar169                                          | self.calendar                                                    | Internal calendar, no public calendar getters.                                                                                                                |
| 9 year-month fields                   | dateFieldsView169 (extended)                              | calendar_fields through first_day168                             | Own normalized provider fields; complete provider conversion dependency.                                                                                      |
| 10 day1                               | start day:1 literal169                                    | first_day subtracts calendar day-1                               | Fixed first calendar day for either direction. Receiver reference ISO day is not operation anchor.                                                            |
| 11 constrained full date              | calendarToEpochDayRaw170 + explicit PlainDate bound171    | PlainDate::from_epoch_day(first)177                              | Full-date input bound intentionally narrower than YearMonth range.                                                                                            |
| 12 calendar addition                  | addNormalizedCalendarDate173 plus dayCheck174             | add_extended185                                                  | Added result full-date bound now enforced; correction below.                                                                                                  |
| 13 resulting year-month fields        | raw helper returns normalized result.date                 | provider result epoch retained                                   | Fused with next step under first-day preservation; not an independent complete provider proof.                                                                |
| 14 canonical year-month               | create uses result epoch175–179                           | full-date check187 then from_epoch_day_in188                     | Equivalent only if provider addition of day1 yields canonical first calendar day. General caller-level CalendarYearMonthFromFields proof remains conditional. |
| 15 fresh result                       | createPlainYearMonth113 allocates/sets private slot       | new typed Self                                                   | YearMonth-specific bound checked; fresh JS result even zero duration.                                                                                         |

## Corrected added-date range gap

[Compared CalendarDateAdd §12.3.7 step3](https://tc39.es/proposal-temporal/#sec-temporal-calendardateadd)
checks ISODateWithinLimits before returning the added full date. YearMonth result
has a wider ISO reference-date range. Previously both engines checked only that
wider range after raw addition, losing the intermediate bound.

Witness uses built-in arithmetic Islamic civil calendar, not arbitrary provider:

```js
const origin = new Temporal.PlainYearMonth(275760, 8, 'islamic-civil', 22)
origin.add({months: 1}) // Required comparison behavior: RangeError
origin.subtract({months: -1}) // Same forward addition: RangeError
new Temporal.PlainYearMonth(275760, 9, 'islamic-civil', 21).toString()
// '+275760-09-21[u-ca=islamic-civil]' remains valid YearMonth representation
origin.with({month: 6}).toString() // Same valid YearMonth representation
```

Origin is calendar 283583-M05-01, ISO +275760-08-22, epoch day 99999978.
Target 283583-M06-01 is ISO +275760-09-21, epoch day 100000008: 8 days past
PlainDate maximum, inside supported September YearMonth. Independent arithmetic:
Islamic civil day1 = -492148 +354*(year-1)+floor((3+11*year)/30)
+ceil(29.5*(month-1)). It yields both literal epoch coordinates. Node v26.5.1
native Temporal confirms both add/subtract RangeErrors and constructor/with
successes. Regression controls reproduced incorrect acceptance in TS, installed
native and typed Rust before correction.

TS calendarToEpochDayRaw and addNormalizedCalendarDate intentionally permit
extended coordinates. Rust CalendarProvider.add_extended forwards to arithmetic
core::add_extended, whose guard is ±110000000 days, not PlainDate bounds. Raw
helpers supply no hidden full-date guard; caller must enforce it.

[TS result guard174](../../packages/temporal/plain-year-month.ts#L174) now checks
result.epochDay immediately after raw addition. [Rust guard187](../../crates/temporal/short_dates.rs#L187)
checks PlainDate::from_epoch_day(epoch) before YearMonth construction. Global
raw/extended helpers retain extended intermediates needed by other callers.
The original full-date anchor check and final YearMonth check remain separate.

## Observable mutation and ordering

Previously private Object.keys(fields) enumeration ran before options and could
throw even on valid branded duration. [Indexed canonical field scan152](../../packages/temporal/plain-year-month.ts#L152)
removes that hook; subtraction still precedes overflow conversion. Native
path skips TS sign scan and passes subtract boolean to Rust; shared public value
and getter tests must cover both actual backends.

Shared date arithmetic still has dependencies: private Array.map(integer) inside
calendar.ts:addCalendarEpochDay, private normalized CalendarDate copies and
provider arithmetic. Helper hook closure remains separately owned. This caller
audit does not close every mutation surface of those helpers.

Positive behavior controls should distinguish nondefault receiver reference day,
forward/backward month crossing, subtract of negative duration, overflow rejection
before component restriction and first-day-at-minimum full-date rejection.
Existing short-dates.test.ts:75 covers ordinary ISO add/subtract under poisoned
Array iterator; Hebrew test:145 covers leap-month conversion/addition. Existing
short-date fixtures establish sampled values, not full provider equivalence.

## Validation and residual obligations

[Shared range controls340](../../packages/temporal/tests/plain-arithmetic-oracle.ts#L340)
retain literal constructor/with successes and both operation rejections. The
[typed Rust control3878](../../crates/temporal/lib.test.rs#L4128) also checks exact
epoch coordinates. All three owning TS/native/Rust range controls
failed before correction. All nine focused gates pass.

[Shared private-field controls11](../../packages/temporal/tests/plain-arithmetic-oracle.ts#L11)
exercise add/subtract for PlainDate, PlainDateTime and PlainYearMonth under
independent Object.keys and Array iterator replacement. They restore mutations
before output assertions, verify literal arithmetic outputs and one public
overflow Get per operation. These controls support this caller mutation repair;
they do not prove unrelated Array method or provider contracts.

Remaining: complete Duration conversion/integer bounds; constrained calendar
field resolution; all supported arithmetic/table calendars; first-day canonical
result proof; native direct/generic transport and JS property observability;
realm allocation. Complete step coverage above records delegated/open steps;
it does not turn sampled provider or oracle evidence into full section signoff.

## Final validation

All 31 expanded tests pass (20 executed, 11 cached), including all 15 affected
class/backend gates and six Rust consumer suites. Temporal package assembly
passes. [Exact target matrix](temporal-plain-add-validation-targets.txt).
No baseline, fixture count or exclusion changes. These checks support the
corrected paths; delegated contracts above remain open.
