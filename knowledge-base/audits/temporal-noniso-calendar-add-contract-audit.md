# Non-ISO CalendarDateAdd contract

Reviewed 2026-11-22. Requested [ECMA-262](https://tc39.es/ecma262/) snapshot has no
Temporal API chapters. Published proposal
[§12.3.6 NonISODateAdd](https://tc39.es/proposal-temporal/#sec-temporal-nonisodateadd)
and [§12.3.7 CalendarDateAdd](https://tc39.es/proposal-temporal/#sec-temporal-calendardateadd)
are comparison only; no change of authority or completed Temporal section.

## Full numbered operation and authority limits

§12.3.6 is explicitly implementation-defined processing, with no numbered
internal algorithm. It returns an ISO date after calendar-specific addition and
may reject when reject-overflow would require clamping. Do not invent numbered
substeps or import a historical mandatory non-ISO year/month/day policy.

| Compared §12.3.7 step       | Current implementation                                                                             | Obligation/status                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1 ISO branch                | calendar.ts:addYearMonth403, calendarToEpochDayRaw313, addCalendarEpochDay450                      | Fixed12-month serial arithmetic plus ISO regulation and week/day translation. Separate ISO arithmetic proof. |
| 1.a balance ISO year/month  | addYearMonth416–420                                                                                | Bounded integer years/months; same-sign validated DateDuration dependency.                                   |
| 1.b regulate original day   | calendarToEpochDayRaw344                                                                           | Clamps/rejects through regulate143 before week/day displacement.                                             |
| 1.c weeks*7+days            | addCalendarEpochDay478                                                                             | Number integer sum of bounded Duration date components.                                                      |
| 1.d add ISO days            | addCalendarEpochDay478                                                                             | Epoch-day translation; no timezone/clock conversion.                                                         |
| 2 non-ISO branch            | addYearMonth403 plus calendar-specific helpers; native calendarAdd1088                             | Concrete policy below, conditional on complete calendar provider/data.                                       |
| 2.a call NonISODateAdd      | calendar.ts:addNormalizedCalendarDate481 or addCalendarDateRaw431; Rust NumericCalendar::add_raw37 | Provider delegation, not an independent specification-defined month algorithm.                               |
| 3 final ISODateWithinLimits | date-core.ts:addDate569; calendar.ts:addCalendarDate496; PlainYearMonth added guard174             | Public full-date callers own exact final bounds. Raw helpers intentionally differ.                           |
| 4 return result             | normalized epoch-day/date record; typed Calendar.add or bounded caller result                      | Complete public operation only if caller applies required guard and provider succeeds.                       |

## Actual chosen calendar policy

[TS year/month arithmetic403](../../packages/temporal/calendar.ts#L403) first adds
years, preserving month identity for Hebrew/Chinese/Dangi, then adds a serial
month count. Fixed-month arithmetic calendars use fixed12 or13 months per year.
Hebrew uses elapsed-month counts and a corrected 19-year estimate. Chinese/Dangi
use table/host leap-month and month-serial lookup. Weeks then count7 epoch days;
days count1, independent of timezone or clock.

[Original-day regulation473](../../packages/temporal/calendar.ts#L473) happens
after year/month movement and before week/day translation. Reject-overflow
rejects a missing leap-month identity or invalid original day; constrain selects
supported replacement month/day. Hebrew M05L maps to month6 in either target
year, rejecting its absence only under reject. Table calendars apply leap-month
fallback through monthFromCode222. These are documented implementation choices;
sampled disagreement with another provider alone would not establish violation
of an absent prescribed non-ISO algorithm.

[Rust NumericCalendar17–58](../../crates/intl_datetimeformat_calendars/date_math.rs#L17)
implements matching order: checked year addition, typed MonthCode resolution,
serial month movement, original-day regulation, checked weeks*7+days addition.
Arithmetic Calendar and validated TableCalendar both implement that trait.
[CalendarProvider21](../../crates/temporal/calendar_provider.rs#L21) is sealed;
its supported engines are arithmetic calendars and immutable validated tables,
not arbitrary user JS calendar callbacks. CalendarRef forwards to those engines.

JS public option getters/conversions remain in callers. Internal provider query
count is not a normative NonISODateAdd contract. Equivalent values do not prove
JS property access order, realm semantics or reentrant backend behavior.

## Counts, overflow and range boundaries

TS [integer/year/day checks119–132](../../packages/temporal/calendar.ts#L119)
require integer coordinates and calendar year magnitude at most400000.
DateDuration arrives from validated common-sign Duration fields. Calendar years,
months and weeks are below2^32 magnitude; days are additionally limited by total
Duration time bound. Consequently weeks*7+days and month serial counts remain
safe integers; supported epoch-day outputs are far below2^53. Arithmetic stays
integer; no fractional month approximation or epoch Number round-trip occurs.

Rust checks signed additions/multiplications and calendar year bounds. Month
serial arithmetic is integer; arithmetic year_month rejects serial magnitude
above6000000. These limits must remain sufficient for every supported public
result, rather than being confused with specification-authorized arbitrary
restriction. No concrete valid-public result excluded by these bounds was found.

Full PlainDate bounds are inclusive epoch days[-100000001,100000000]. Raw TS
calendar conversion guards extended epoch coordinates at±110000000; Rust
[arithmetic add_extended439](../../crates/intl_datetimeformat_calendars/core.rs#L439)
and [table add_extended341](../../crates/intl_datetimeformat_calendars/table_calendar.rs#L341)
also support extended intermediates. Table membership can impose further data
availability limits. These raw methods cannot stand in for §12.3.7 step3 alone.
The separate YearMonth correction now checks the full added date before applying
YearMonth's wider reference-date bound.

TS Chinese/Dangi packed tables decode leap patterns, month lengths and prefix
checkpoints in [Packed metadata decoding37](../../packages/temporal/calendar-table.ts#L37).
Month movement is [tableAddMonths176](../../packages/temporal/calendar-table.ts#L176).
Host-calendar builds select hostCalendarAddMonths instead. Umm al-Qura uses
available table data with arithmetic Islamic civil fallback outside table years.
Rust borrowed table engines use corresponding typed structures and arithmetic
fallback. Provider/table completeness, generated data, host fallback accuracy and
all-calendar value parity remain explicit dependencies; this pass proves none
of them merely by inspecting an adapter.

## Native ownership

[Native calendarAdd1088](../../packages/temporal/native.ts#L1088) copies four date
components into a null-prototype transport record. [FFI741](../../crates/temporal/ffi.rs#L741)
resolves original calendar fields with reject, parses date components, calls
add_extended, then converts extended result back to normalized calendar fields.
It deliberately does not impose final public PlainDate bounds there. Public
callers or typed bounded Calendar.add own them. Direct specialized date operations
can bypass this generic transport; both paths need owning public evidence.

## Corrected private month-code and metadata operations

The public non-ISO path formerly interpreted private month codes through
RegExp.test, String.slice and endsWith; regex execution also altered legacy
RegExp state. [Calendar-specific recognition222](../../packages/temporal/calendar.ts#L222)
now checks exact code-unit positions and lengths, retains Hebrew M05L handling,
and reuses bounded isoMonthFromCode with explicit M13 support only for
Coptic/Ethiopic/Ethioaa. Chinese/Dangi retain ordinary01–12 plus optional L and
target-year leap resolution. Malformed month-code shapes reject before leap-table lookup.
No calendar arithmetic rule changes.

[Month generation205](../../packages/temporal/calendar.ts#L205) and shared
[arithmetic generation180](../../packages/ecma402-abstract/Calendar/Arithmetic.ts#L180)
now concatenate bounded numeric digits; they do not consult mutable String or
padStart. [Packed metadata decoding37](../../packages/temporal/calendar-table.ts#L37)
uses captured original String.prototype.indexOf through captured Reflect.apply.
This preserves dictionary decoding without a post-import mutable method lookup.

[Date component normalization450](../../packages/temporal/calendar.ts#L450)
now converts the four own components in an indexed loop, avoiding Array.map and
Array species construction. [Private addition record475](../../packages/temporal/calendar.ts#L475)
has own monthCode:undefined, preventing inherited Object.prototype.monthCode
from leaking into internal conversion. Intended public inherited fields remain
observable.

These calendar-specific readers do not claim full
[proposal §12.2.1 ParseMonthCode](https://tc39.es/proposal-temporal/#sec-temporal-parsemonthcode)
coverage: abstract syntax includes M00L and M01..M99 with optional L. Supported
calendar semantics are narrower. No terminal-newline acceptance defect existed:
original non-multiline JS regexes already reject LF/CR suffixes. Indexed checks
retain that behavior; malformed controls establish parity, not a new lexical fix.

## Host execution follow-up

[Host-provider closure audit](temporal-host-calendar-private-closure-audit.md)
repairs cold/warm cache hooks, private year lists, eviction iteration and captured
Intl invocation. It preserves existing data selection and arithmetic policy;
host data completeness and arbitrary provider contracts remain open.

## Public evidence and remaining obligations

[Shared addition controls11](../../packages/temporal/tests/plain-arithmetic-oracle.ts#L11)
precreate ISO date/date-time/year-month and Hebrew/Chinese/Dangi receivers,
then test literal addition outcomes under independent keys, iterator, map,
species, inherited monthCode, RegExp.exec/test, String.slice/endsWith/padStart/
indexOf, global String and legacy RegExp state controls. Nine operations cover
both ISO add/subtract and three non-ISO month additions. Species/statics controls
run only when runtime exposes those facilities. Mutations restore before output
assertions; every successful operation still reads public overflow once.

Full poison controls failed in forced TS before correction; installed native
already passed. This is evidence of removed frontend hooks, not a typed Rust
arithmetic change. Seven focused gates pass. Expanded validation passes all
73 tests (60 executed, 13 cached) plus Temporal and DurationFormat package
builds; [manifest](temporal-calendar-add-validation-targets.txt).

[Six literal grammar/ordinal controls171](../../packages/temporal/tests/plain-arithmetic-oracle.ts#L171)
retain Hebrew leap M05L and ordinary M06, missing-leap constrain fallback,
Coptic M13 and Chinese present/missing leap M02L. [Seven rejection controls185](../../packages/temporal/tests/plain-arithmetic-oracle.ts#L185)
cover missing leap under reject, unsupported calendar month codes and trailing
newline parity. [Inherited public getter205](../../packages/temporal/tests/plain-arithmetic-oracle.ts#L205)
checks Hebrew M01 produces2023-09-16 and monthCode Get occurs once.
These distinguish semantic preservation from broad hook suppression.

No new normative arithmetic defect established in this slice. Complete provider
and generated/host data coverage, complete PrepareCalendarFields/ParseMonthCode
coercion/error ordering, constrained leap choices across all data years, native
specialized/generic transport, realms and reentrant backend changes remain open.
Implementation-defined arithmetic policy does not supply missing authoritative
ECMA-262 API sections or whole-provider proof.
