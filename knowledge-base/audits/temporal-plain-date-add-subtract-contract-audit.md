# PlainDate.add/subtract contract comparison

Reviewed 2026-11-22. Historical ledger leaves
public add 352–354, subtract 362–364 and AddDurationToDate 967–974 open. Requested
[ECMA-262](https://tc39.es/ecma262/) snapshot lacks Temporal API chapters.
Temporal numbers below refer only to separately published proposal comparisons,
not replacement authority or complete signoff. Existing 8055–8058 work is not
reclassified by this review.

## Public wrappers

[Comparison §3.3.21 add](https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.add)
and [§3.3.22 subtract](https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.subtract)
each have three steps:

| Compared step        | Current code and result                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 receiver           | [plain-date.ts:366](../../packages/temporal/plain-date.ts#L366), [subtract:369](../../packages/temporal/plain-date.ts#L369): retain this for private read.                        |
| 2 brand              | [read:140](../../packages/temporal/plain-date.ts#L140): private slot lookup; captured TypeError before duration/options access. Proxy wrapper does not inherit its target's slot. |
| 3 delegate operation | [plain-date.ts:367](../../packages/temporal/plain-date.ts#L367), [subtract:370](../../packages/temporal/plain-date.ts#L370): common helper with sign +1 or −1.                    |

## AddDurationToDate steps

[Comparison §3.5.15](https://tc39.es/proposal-temporal/#sec-temporal-adddurationtodate)
contains eight steps, independently read from official rendered HTML. AST source
check locates addDate(value,fields,overflowOption(options)) at 228.

| Compared step          | Current code and result                                                                                                                                                                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 calendar slot        | [plain-date.ts:201](../../packages/temporal/plain-date.ts#L201): private DateSlot.calendar, no public calendar getter.                                                                                                                                                                                                                |
| 2 ToTemporalDuration   | [plain-date.ts:207](../../packages/temporal/plain-date.ts#L207): toDurationFields or native-data toNativeDurationFields, both validate before overflow. Existing Duration copies private fields in TS; strings parse; bags read ten fields in defined order with immediate integral ToNumber. Full conversion proof remains separate. |
| 3 subtraction negation | [plain-date.ts:223](../../packages/temporal/plain-date.ts#L223): indexed scan of fixed durationFieldNames multiplies private fields by −1, or native subtract boolean 218. No second duration-like conversion. Negative zero is mathematically zero; no public zero sign observable in PlainDate result.                              |
| 4 discard subday time  | [plain-date.ts:225](../../packages/temporal/plain-date.ts#L225): exact time nanoseconds excluding existing days; truncating BigInt division by nsPerDay; add whole days to fields.days. Other clock fields remain on private record but date arithmetic consumes only date fields.                                                    |
| 5 options object       | [overflowOption:117](../../packages/temporal/date-core.ts#L117), called 228 or 219: optionsObject accepts undefined/object; rejects null/primitives. Entire duration conversion and private date normalization precedes this.                                                                                                         |
| 6 overflow             | [date-core.ts:118](../../packages/temporal/date-core.ts#L118): one overflow Get, default constrain; ToString otherwise; only constrain/reject. Abrupt completion stops calendar arithmetic.                                                                                                                                           |
| 7 CalendarDateAdd      | [addDate:569](../../packages/temporal/date-core.ts#L569): original date/calendar, date duration, overflow; addNormalizedCalendarDate and final dayCheck. Full calendar contract not implied by wrapper map.                                                                                                                           |
| 8 fresh date           | [createPlainDate:145](../../packages/temporal/plain-date.ts#L145): validate integer epoch day in[-100000001,100000000], allocate intrinsic prototype, same calendar/private slot. Zero/subday-only addition still returns fresh object after overflow validation.                                                                     |

## Whole-day arithmetic and precision

[Comparison §7.5.7 ToDateDurationRecordWithoutTime](https://tc39.es/proposal-temporal/#sec-temporal-todatedurationrecordwithouttime)
has three steps:

1. Normalize duration with 24h days. Existing days are integer and share sign with
   clock fields under validated Duration invariant.
2. Truncate normalized time/nsPerDay. TS computes days+truncate(clock/nsPerDay).
   Same-sign integer days make this exactly equal to
   truncate((days*nsPerDay+clock)/nsPerDay), including negative subday values.
3. Preserve years/months/weeks and resulting whole-day count. TS date helper
   ignores residual clock fields. Rust folds weeks*7 into date-day addition,
   which is the calendar contract's equivalent day contribution.

No epoch nanoseconds convert to Number. Validated total day/time magnitude is
below 2**53 seconds. Whole-day quotient and combined day count stay below 2**37,
so captured Number conversion and integer addition are exact. Years/months/weeks
are each below 2**32; weeks\*7 plus days remains far below 2**53. These bounds prove
numeric exactness, not calendar conversion correctness.

Consequences to preserve: ±23h contributes zero days; ±24h contributes ±1;
±47h contributes ±1. Subtract negates before truncation: subtracting−23h still
contributes zero, and subtracting−24h adds one day. No floor-negative off-by-one.
Mixed-sign invalid duration rejects before options even when discarded time
would otherwise leave a valid date record.

## Native and Rust routes

[plain-date.ts:211](../../packages/temporal/plain-date.ts#L211) dispatches only
after duration preparation. overflowOption:219 is evaluated before native method
entry; parsed overflow string and subtract boolean accompany validated fields.
[Native adapter:891](../../packages/temporal/native.ts#L891) uses typed
addPlainDate callback when supplied, otherwise addPlainDate query and dateResult.
Result creation still enforces PlainDate epoch-day bounds/calendar.

[Rust PlainDate::checked_add:165](../../crates/temporal/date.rs#L165) divides exact
clock nanoseconds by NANOSECONDS_PER_DAY (truncation toward zero), combines
weeks*7+days+extraDays, then calls provider date addition. checked_subtract:175
negates validated Duration once. [add_date:178](../../crates/temporal/date.rs#L178)
converts bounded fields to provider DateDuration, calls calendar.add, maps errors,
then validates resulting epoch day. Native FFI addPlainDate delegates these typed
paths; typed Rust supplies no JS property/coercion semantics.

TS [calendar.ts:481](../../packages/temporal/calendar.ts#L481) may dispatch
calendarAdd for native calendar data or use shipped arithmetic/table provider.
Thus native frontend, shared calendar backend and host/provider modes retain
separate data/error contracts. Constrain handles invalid month-day before
week/day displacement; reject must reject that invalid calendar component even
if later day displacement would produce representable final date.

## Private iteration correction and evidence

[plain-date.ts:223](../../packages/temporal/plain-date.ts#L223) now scans fixed
durationFieldNames by index. Negation no longer calls mutable Object.keys or
Array iteration. Same ten normalized fields receive the same sign; conversion,
whole-day truncation and overflow ordering remain unchanged.

Shared [plain arithmetic controls](../../packages/temporal/tests/plain-arithmetic-oracle.ts#L75)
exercise private-key and iterator mutation across PlainDate, PlainDateTime and
PlainYearMonth. Before correction, the TS gate reproduced six Object.keys and
four iterator failures; native control passed. All nine focused gates pass.
These results establish the mutation defect and native control, not complete
calendar/API compliance.

Existing [shared public calendar oracle:533](../../packages/temporal/tests/public-calendar-oracle.ts#L533)
checks public constrained addition and expected boundary rejections across
calendars. Both public-calendars.test.ts and public-calendar-host.ts invoke that
checker. These fixtures do not prove every duration/overflow abrupt completion,
subtraction, time truncation or realm case.

Meaningful public controls if absent: wrong receiver before duration getter;
invalid mixed-sign duration before overflow getter; inherited duration getter
with immediate ToNumber before next duration field; overflow getter/ToString
abrupt identity; ±23/24/47h truncation across add/subtract; January 31+1month under
constrain/reject; zero/subday-only fresh result and required overflow validation;
minimum/maximum PlainDate crossing. Expectations follow literal date arithmetic,
not production helper output. Inspect existing suites before adding duplicates.

## Remaining obligations

No further ordinary arithmetic defect established in this operation map. Full
ToTemporalDuration/parser/bag conversion; every calendar's add,
leap-month/constrain/reject ordering and supported range; native provider/FFI
contracts; receiver/foreign-realm/prototype allocation and abrupt completion
coverage remain open. Complete historical line credit or API signoff unwarranted.

Relevant numbered ECMA-262 dependencies:
[§10.1.15 RequireInternalSlot](https://tc39.es/ecma262/#sec-requireinternalslot),
[§7.3.2 Get](https://tc39.es/ecma262/#sec-get-o-p),
[§7.1.4 ToNumber](https://tc39.es/ecma262/#sec-tonumber),
[§7.1.19 ToString](https://tc39.es/ecma262/#sec-tostring),
[§10.1.12 OrdinaryObjectCreate](https://tc39.es/ecma262/#sec-ordinaryobjectcreate).
These do not supply missing Temporal chapter authority.

## Final validation

All 31 expanded tests pass (20 executed, 11 cached), including all 15 affected
class/backend gates and six Rust consumer suites. Temporal package assembly
passes. [Exact target matrix](temporal-plain-add-validation-targets.txt).
No baseline, fixture count or exclusion changes. These checks support the
corrected paths; delegated contracts above remain open.
