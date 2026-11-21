# Gregorian local-time records

Reviewed 2026-11-21 against published
[ECMA-402 §11.5.11 ToLocalTime](https://tc39.es/ecma402/#sec-tolocaltime) and
[§11.5.12 Table 17](https://tc39.es/ecma402/#sec-datetimeformat-tolocaltime-records).
This maps the Gregorian record within the supported finite timestamp domain,
including timezone padding. Offset parsing, named-zone availability/data policy,
non-Gregorian computations and complete caller/realm contracts remain open.

## Record versus display year

Table 17 requires signed YearFromTime, with a separate BC/AD era field. Both
[TS CalendarDateFromTime:42–48](../../packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.ts#L42)
and [Rust calendar::gregorian:51–63](../../crates/intl_datetimeformat/calendar.rs#L51)
instead converted nonpositive years to positive era years. New direct record
controls failed in both languages: the minimum-date year was 271822 instead of
−271821; Rust also returned year 1 instead of 0 at Gregorian year zero.

The producers now retain the signed year and select the era independently. ISO
uses this same proleptic Gregorian representation. The existing
[display normalization](temporal-calendar-year-audit.md) in §11.5.4 step 15.f.iv
converts the year when rendering. Thus internal year 0/−1 yields displayed 1/2 BC.
Optional calendar provider fields and Temporal's own calendar arithmetic are not
changed by this Gregorian/ISO correction.

## §11.5.11 step correspondence

| Step                                       | Current implementation                                                                                                                                                                                                                             | Review status                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 / 1.a: fixed offset                      | [TS private dispatch/scanner](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L84); Rust timezone resolution produces an offset zone before rendering.                                                                               | Public DateTimeFormat offsets are minute-only. The TS scanner assumes validated input; it is not the separately reviewed Temporal grammar scanner. Complete grammar/caller equivalence remains open.                                                                                                                                                                             |
| 2 / 2.a: named-zone availability assertion | TS receives a canonical data identifier from initialization. Rust resolves an available zone before local conversion.                                                                                                                              | Complete initialization, missing-data fallback and availability policy remain open; arbitrary helper strings are not signed off.                                                                                                                                                                                                                                                 |
| 2.b: named offset                          | [TS TimeZoneOffset:68](../../packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.ts#L68), [Rust timezone snapshot:291–315](../../crates/intl_datetimeformat/timezone.rs#L291)                                                                  | Selected transition/future rule supplies offset and DST. Existing all-zone/golden-zone comparisons cover boundaries; data policy and complete selection algorithms remain open.                                                                                                                                                                                                  |
| 3: offset addition                         | [TS:138–164](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L138), [Rust timezone::local_time:317](../../crates/intl_datetimeformat/timezone.rs#L317), [render provider input:146](../../crates/intl_datetimeformat/render.rs#L146) | Integer offsets commute with flooring. TS checks safe integer milliseconds, offset and sum; fractional offsets use original BigInt text through Decimal before floor. Rust adds integer nanoseconds with checked arithmetic and Euclidean division. Existing [precision evidence](temporal-local-offset-precision-audit.md) remains bounded, not a complete parser/domain proof. |
| 4 / 4.a: Gregorian record                  | TS calendar helper plus clock/weekday fields below; Rust builtin CalendarRegistry plus CivilDateTime and TimeZoneOffset.                                                                                                                           | Signed Gregorian record correspondence corrected and mapped below.                                                                                                                                                                                                                                                                                                               |
| 5 / 5.a: other calendars                   | TS invokes the selected calendar provider; Rust invokes its captured provider with adjusted local milliseconds.                                                                                                                                    | Full best-available calendar computations and their record contracts remain open. ISO's shared Gregorian representation is tested here; this does not sign off all non-Gregorian providers.                                                                                                                                                                                      |

## Named-transition precision boundary

For an integer-second transition S and integer nanosecond instant N,
N >= S * 10**9 exactly when floor(N / 10**6) >= S * 1000. Thus flooring to
milliseconds before selecting an explicit IANA transition loses no transition
information. Rust instead compares S with floor(N / 10**9), using i128.

TS compares integer transition seconds with milliseconds / 1000. Within the
supported Date/Temporal range and internal timezone padding, the quotient's
magnitude is below 2**43. Half a binary64 spacing is at most 2**-11 seconds,
less than the 1/1000-second distance of a nonintegral millisecond timestamp from
an integer-second boundary. Correct rounding therefore cannot cross that
boundary. Integral quotients are exact. This proves that comparison step for
integer-second data; complete transition/future-rule production and selection
remain separate dependencies. Fractional-offset arithmetic keeps its distinct
Decimal path and precision evidence.

## §11.5.12 Table 17 correspondence

The table's Gregorian formulas evaluate floor(tz / 10**6) before date/clock
extraction. TS passes that common integer millisecond value to its helpers.
Rust's CivilDateTime retains nanoseconds; its day/clock quotients and the provider's
Euclidean millisecond quotient produce the same Gregorian components. Calendar
months use zero-based indices in both record implementations.

| Required field                       | TypeScript                                                                                                                                            | Rust representation                                                                                                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Weekday                              | [ToLocalTime:167](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L167) calls WeekDay.                                                  | [CivilDateTime:50](../../crates/intl_datetimeformat/civil.rs#L50): (days + 4).rem_euclid(7).                                                                                            |
| Era                                  | [CalendarDateFromTime:45](../../packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.ts#L45): AD exactly when signed year > 0, otherwise BC. | [calendar:53–55](../../crates/intl_datetimeformat/calendar.rs#L53): BC exactly when civil.year < 1, otherwise AD.                                                                       |
| Year                                 | [43–46](../../packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.ts#L43): signed YearFromTime retained.                                    | [calendar:56](../../crates/intl_datetimeformat/calendar.rs#L56): signed civil.year retained.                                                                                            |
| RelatedYear / YearName               | Gregorian helper supplies neither optional field, representing undefined values for internal consumers.                                               | [calendar:62–63](../../crates/intl_datetimeformat/calendar.rs#L62): both None. No numeric/cyclic year payload for Gregorian.                                                            |
| Month                                | [47](../../packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.ts#L47): MonthFromTime.                                                      | [calendar:57](../../crates/intl_datetimeformat/calendar.rs#L57): civil.month - 1.                                                                                                       |
| Day                                  | [48](../../packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.ts#L48): DateFromTime.                                                       | [calendar:58](../../crates/intl_datetimeformat/calendar.rs#L58): civil.day.                                                                                                             |
| Hour / Minute / Second / Millisecond | [ToLocalTime:168–171](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L168): corresponding pure date helpers.                           | [CivilDateTime:51–54](../../crates/intl_datetimeformat/civil.rs#L51): nonnegative within-day remainder divided by hour/minute/second scales; nanosecond / 1,000,000 yields millisecond. |
| InDST                                | [ToLocalTime:172](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L172): selected zone-data Boolean; fixed offsets use false.           | TimeZoneOffset.in_dst is retained with the civil fields. Data generation/history policy remains an open dependency.                                                                     |

The TS date helpers have a separate [ECMA-262 arithmetic proof](temporal-date-operations-audit.md).
Its bounds and floating-point division requirements still apply. Rust bounds
civil conversion to the Date range plus 31 days of internal YearMonth padding;
all resulting years fit i32. This record mapping relies on the existing civil/calendar arithmetic; it adds no
new signoff of the complete Rust civil conversion algorithm. Arbitrary BigInt
input support and complete public range validation remain open. The extra TS
timeZoneOffset field stores FormatJS metadata.

## Evidence

[TS direct local-record controls](../../packages/intl-datetimeformat/tests/rust-timezones.test.ts)
check 108 complete records: six anchors including negative year, year zero, year
one, epoch and near both Date limits; UTC and two signed offsets; and −1/0/+1 ns
around local midnight, for Gregorian and ISO. The expected fields come from
builtin Date at the independently fixed local millisecond. No Number conversion
of input nanoseconds constructs the oracle. Optional Gregorian fields are absent;
all ordinary date/clock, era, offset and DST values are checked together.

[Rust CalendarRegistry controls](../../crates/intl_datetimeformat/calendar.test.rs)
check twelve complete builtin provider records at the Date bounds, years −1/0/1
and epoch. Both the new table and existing year-zero assertion failed before the
fix. Builtin registry methods are exercised directly without a replacement provider.

The all-zone/golden-zone comparison previously inverted the TS era year to obtain
an astronomical year. That adapter is removed now that TS returns the required
signed value directly. Its transition corpus and nanosecond vectors are unchanged.
The existing fractional-offset Date oracle likewise expects signed record years.
CalendarDateFromTime's Gregorian/ISO reference now uses builtin signed Date fields;
its non-Gregorian Temporal comparisons remain active.

All seven focused gates pass after those expected-record corrections (four
executed, three cached): timezone runtime/compiler checks, TS units, Rust units,
native Temporal integration and owned Temporal integration. The owned minimum-date
control still explicitly requires 271822 BC for its signed negative Gregorian year.
Full 42-case pattern replay passes in isolation (323.5 seconds). The expanded
204-target run passes 202 tests (65 executed, 139 cached); raw ListFormat and
PluralRules strict diagnostics exactly match their existing constructor-realm
baseline keys/messages across 162/106 scenarios. Baseline-aware gates pass.
All ten package assemblies, all 40 Temporal class/backend gates and the unchanged
12,808-case ICU snapshot pass. Native DateTimeFormat comparison passes 9,440 cases
and 40,284 assertions per source/bytecode run.

Parent #8109's all-target CI exposed a missed native-Hermes extended-calendar
oracle outside the previous inventory: it expected raw Buddhist year −271278,
while published display normalization requires 271279. The same gate reproduced
that failure locally. Its [expectation](../../packages/temporal/tests/extended-calendar-host.ts#L70)
now applies the published year transformation to raw ICU fixture values. All
300 independent checks pass in source and bytecode; both owning public-calendar
runtime/compiler gates also pass. Fixtures, runtime arithmetic and other tested
source hashes remain unchanged after the broad run. Those three gates expand
the inventory to 207; combined validation covers 205 passing targets and the two
existing raw strict baseline failures. No accepted-failure baseline, exclusion
or timeout change. No new specification inconsistency or historical Temporal
source-line credit is claimed.
