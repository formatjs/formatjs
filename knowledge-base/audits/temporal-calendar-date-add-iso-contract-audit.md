# CalendarDateAdd: ISO contract comparison

Reviewed 2026-11-22. Requested [ECMA-262](https://tc39.es/ecma262/) snapshot lacks
Temporal API chapters. Temporal section numbers below are separately published
proposal comparisons only, not replacement authority or method signoff. Source
anchors reflect current private-operation correction. Existing audit index leaves
this operation and its arithmetic dependencies open.

## CalendarDateAdd

[Comparison §12.3.7](https://tc39.es/proposal-temporal/#sec-temporal-calendardateadd)
has four top-level steps. ISO inputs below mean validated original ISO date,
valid homogeneous-sign DateDuration record and overflow constrain/reject.

| Compared step             | Source correspondence and obligation                                                                                                                                                                                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 ISO branch              | [date-core.ts:574](../../packages/temporal/date-core.ts#L577) retains base calendar; [calendar.ts:450](../../packages/temporal/calendar.ts#L450) uses common arithmetic path. For iso8601, monthsInYear=12 and Gregorian arithmetic conversion applies.                                                    |
| 1.a balance year/month    | [calendar.ts:403](../../packages/temporal/calendar.ts#L403): add years first, serialize12*(year+years)+originalMonth−1+months, floor-divide12 and modulo12. Algebraically BalanceISOYearMonth(originalYear+years,originalMonth+months). See bounds below.                                                  |
| 1.b regulate original day | [calendar.ts:473–478](../../packages/temporal/calendar.ts#L473), [calendarToEpochDayRaw:313](../../packages/temporal/calendar.ts#L313): normalized year/month plus original day; constrain clamps, reject throws before week/day displacement.                                                             |
| 1.c combine days/weeks    | [calendar.ts:478](../../packages/temporal/calendar.ts#L478): exact days+7*weeks, integer validation.                                                                                                                                                                                                       |
| 1.d add days              | [calendar.ts:478](../../packages/temporal/calendar.ts#L478): epoch-day addition; [addNormalizedCalendarDate:493](../../packages/temporal/calendar.ts#L493) converts resulting coordinate back to date.                                                                                                     |
| 2 non-ISO branch          | Same dispatcher selects calendar arithmetic/table/native provider. NonISODateAdd algorithm is not established by this ISO map.                                                                                                                                                                             |
| 3 final ISO bounds        | [date-core.ts:575](../../packages/temporal/date-core.ts#L578) dayCheck around full result; [calendar.ts:130](../../packages/temporal/calendar.ts#L130) range[-100000001,100000000]. Other raw/normalized entry points require caller-specific guards; do not treat raw helper as complete CalendarDateAdd. |
| 4 return ISO date         | Public date-core returns bounded epoch day; normalized helper additionally returns calendar date for its consumer. Exact Gregorian representation follows the bounded closure proof linked below.                                                                                                          |

AST inventory finds two addNormalizedCalendarDate consumers:
[date-core.ts:576](../../packages/temporal/date-core.ts#L579) and
[plain-year-month.ts:173](../../packages/temporal/plain-year-month.ts#L173).
The latter's full-date bounds correction is covered by the separate YearMonth
contract audit. Raw internal helpers intentionally support wider coordinates;
CalendarDateAdd's final limit cannot be omitted merely because a later API
stores a less precise year/month result.

## BalanceISOYearMonth

[Comparison §9.5.4](https://tc39.es/proposal-temporal/#sec-temporal-balanceisoyearmonth):

| Step                        | Correspondence                                                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 year+=floor((month−1)/12) | [calendar.ts:418–419](../../packages/temporal/calendar.ts#L418): floor(serial/12), where serial=12*(originalYear+years)+(originalMonth+months−1).                                 |
| 2 month=mod(month−1,12)+1   | [calendar.ts:420](../../packages/temporal/calendar.ts#L420), [mod:118](../../packages/temporal/calendar.ts#L118): value−floor(value/12)*12; correct for negative months/yearzero. |
| 3 return record             | [calendar.ts:429](../../packages/temporal/calendar.ts#L429): normalized year/month.                                                                                               |

Rust [date_math.rs:17–35](../../crates/intl_datetimeformat_calendars/date_math.rs#L17)
adds years with checked arithmetic, obtains zero-based serial and converts back.
[core.rs:401–415](../../crates/intl_datetimeformat_calendars/core.rs#L401) uses
Euclidean division, preserving negative-year/month normalization.

Both implementations check intermediate year against ±400000 before/after month
normalization. This is narrower than unrestricted mathematical balancing. For
validated supported ISO origin and homogeneous-sign duration, it cannot reject
a final supported date: months/week/day move in the same direction, so an
already outlying intermediate year cannot return within supported range. This
argument does not extend to arbitrary mixed-sign raw provider records; those
are rejected by [calendar.ts:464](../../packages/temporal/calendar.ts#L464) and
[date_math.rs:44](../../crates/intl_datetimeformat_calendars/date_math.rs#L44).

## RegulateISODate

[Comparison §3.5.7](https://tc39.es/proposal-temporal/#sec-temporal-regulateisodate):

| Step                     | Correspondence                                                                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.a constrain month1..12 | [calendar.ts:338](../../packages/temporal/calendar.ts#L338), [regulate:143](../../packages/temporal/calendar.ts#L143). Month already normalized 1..12 in this caller. |
| 1.b days in month        | [calendar.ts:345–350](../../packages/temporal/calendar.ts#L345): Gregorian month length with leap-year rule.                                                          |
| 1.c constrain day        | Same regulate clamps original valid day to destination month's range.                                                                                                 |
| 2.a reject assertion     | overflowCheck139 allows only constrain/reject before arithmetic.                                                                                                      |
| 2.b reject invalid date  | regulate149–153 rejects out-of-range month/day. Integer fields already required; invalid day fails before week/day addition.                                          |
| 3 create ISO record      | ArithmeticCalendarToEpochDay stores equivalent exact coordinate; final inverse supplies record. This is representation equivalence, not literal record allocation.    |

Rust [core.rs:303–321](../../crates/intl_datetimeformat_calendars/core.rs#L303)
regulates month/day before constructing epoch; [regulate:536](../../crates/intl_datetimeformat_calendars/core.rs#L536)
implements reject-or-clamp. The [bounded Gregorian proof](temporal-calendar-gregorian-closure-audit.md)
establishes the needed leap/year conversion domain; arbitrary years stay outside
that proof.

## AddDaysToISODate

[Comparison §3.5.9](https://tc39.es/proposal-temporal/#sec-temporal-adddaystoisodate):

| Step                             | Correspondence                                                                                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 ISO date->epoch days, add days | [calendar.ts:473–478](../../packages/temporal/calendar.ts#L473). [Arithmetic.ts:112–125](../../packages/ecma402-abstract/Calendar/Arithmetic.ts#L112) uses DayFromYear+month start+leap adjustment+day−1.                        |
| 2 epoch days->epoch milliseconds | No milliseconds materialized; exact integer day coordinate retained. Avoids unnecessary wide binary64 multiplication.                                                                                                            |
| 3 inverse year/month/day         | [calendar.ts:494](../../packages/temporal/calendar.ts#L494), [calendarFromEpochDayRaw:372](../../packages/temporal/calendar.ts#L372), ArithmeticGregorianFromEpochDay. Bounded inverse proof supplies the same final civil date. |

Rust [date_math.rs:50–58](../../crates/intl_datetimeformat_calendars/date_math.rs#L50)
uses checked week*7/day/epoch additions. [core.rs:422–424](../../crates/intl_datetimeformat_calendars/core.rs#L422)
validates original and final days for public calendar.add. Extended add helpers
must not be mistaken for full CalendarDateAdd without outer bounds validation.

## Arithmetic, ordering and observable behavior

Supported ISO year magnitude <276000. Successful intermediate years are bounded
by 400000; validated duration months<2**32. Serial therefore stays below 2**33 in
magnitude while arithmetic proceeds, exactly representable as Number. Floor and
modulo cannot lose an integer here. Public normalized day count below 2**37 and
weeks below 2**32 keep week*7+day and epoch sum far below 2**53. Rust corresponding
operations fit checked i64. These are caller-bound proofs, not guarantees for
arbitrary DateDuration/CalendarProvider inputs.

Regulate day before adding weeks/days. Example 2021-01-31+P1M1D with constrain
regulates to February 28 then adds one day, yielding March 1; reject throws at
February 31, even though a later displacement might reach a valid date.
Negative month normalization must floor, not truncate: 2020-01 plus−1month is
2019-12. These semantic cases supply independent test expectations.

## Private-operation correction and evidence

[calendar.ts:456–463](../../packages/temporal/calendar.ts#L456) now reads all
four duration fields into a dense private array before indexed integer
normalization. This preserves the old evaluation order: years, months, weeks,
days Gets all complete before the first integer validation. It removes private
Array.prototype.map and Array species lookups without changing arithmetic.

The [private destination record:475](../../packages/temporal/calendar.ts#L475)
now has own monthCode:undefined. calendarToEpochDayRaw therefore ignores inherited
Object.prototype.monthCode while public input bags retain their inherited-field
semantics. Non-ISO metadata normalization also uses captured indexOf.
[ECMA-262 §22.1.3.9](https://tc39.es/ecma262/#sec-string.prototype.indexof)
is delegated to the captured original with a primitive alphabet/character and a
dense own argument array through captured Reflect.apply. Private normalization
avoids [§23.1.3.21 Array.prototype.map](https://tc39.es/ecma262/#sec-array.prototype.map)
and its [§10.4.2.3 ArraySpeciesCreate](https://tc39.es/ecma262/#sec-arrayspeciescreate)
dependency entirely. Those
non-ISO mutation controls support this narrow private-operation correction;
they do not close NonISODateAdd's calendar arithmetic contract.

Shared [plain arithmetic controls](../../packages/temporal/tests/plain-arithmetic-oracle.ts#L53)
cover nine public cases. Before correction, TS reproduced 47 failing case/profile
combinations: map 9, species 9, inherited monthCode 9, test 3, exec 3, slice 3,
endsWith 2, padStart 2, indexOf 2, String 2 and legacy state 3. Native controls
passed. Hermes species control runs only when Array[Symbol.species] exists; initial harness absence was
corrected with a capability guard before final red evidence. Seven focused
validation gates pass. Expanded validation passes all 73 tests (60 executed,
13 cached) plus Temporal and DurationFormat package builds. The
[target manifest](temporal-calendar-add-validation-targets.txt) records 75 targets. No
arithmetic changed; no additional ordinary arithmetic/order defect established
by this operation map.

[Gregorian closure](temporal-calendar-gregorian-closure-audit.md) now proves
exact conversion over raw±110million days, supported by direct TS/Rust endpoint
controls. [ISO bounds](temporal-iso-calendar-add-bounds-audit.md) establishes
prepared-input numeric precision, regulation order and complete normalized caller
guards. Remaining: NonISODateAdd calendars and era/leap-month policies; arbitrary
raw/extended helper contracts; full public coercion, native/provider errors and realms;
known existing day/window specification issues. No historical trace credit or
full CalendarDateAdd signoff claimed.
