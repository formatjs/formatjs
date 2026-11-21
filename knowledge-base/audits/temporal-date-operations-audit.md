# Shared UTC date arithmetic

Reviewed 2026-11-21 against published [ECMA-262 §21.4.1](https://tc39.es/ecma262/#sec-overview-of-date-objects-and-definitions-of-abstract-operations).
This pass maps the shared TypeScript DateOperations module, used by Temporal's
kernel, calendar arithmetic and Intl adapters. Executable arithmetic is unchanged.

The review covers integral finite time values within ±8,640,000,000,000,000 ms
and the year origins needed to enclose them. DayFromYear and leap-year arithmetic
are reviewed for integer years -275761 through 275761, covering the needed
Gregorian origins, not arbitrary mathematical integers. NaN, infinities, fractional milliseconds, unbounded years and public
caller coercion are outside this evidence. Existing extended-local-time tests
remain separate evidence; no complete Temporal API clause is signed off here.

## Section and code mapping

All implementation links refer to
[DateOperations.ts](../../packages/ecma262-abstract/DateOperations.ts).
DaysInYear and InLeapYear adapt the current Boolean IsLeapYear contract to the
private day-count and numeric-offset forms; they are not current spec names.

| Published section and steps                                                                | Code                                                                                                                     | Reviewed equivalence                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [§21.4.1.3 Day, step 1](https://tc39.es/ecma262/#sec-day)                                  | [13](../../packages/ecma262-abstract/DateOperations.ts#L13)                                                              | Floor milliseconds divided by milliseconds per day.                                                                                                                                                                                                        |
| [§21.4.1.5 DayFromYear, steps 1–6](https://tc39.es/ecma262/#sec-dayfromyear)               | [22](../../packages/ecma262-abstract/DateOperations.ts#L22)                                                              | Step 1 is explanatory; the four year counts and their weighted sum map directly to the expression.                                                                                                                                                         |
| [§21.4.1.7 YearFromTime, step 1](https://tc39.es/ecma262/#sec-yearfromtime)                | [34](../../packages/ecma262-abstract/DateOperations.ts#L34)                                                              | The two correction loops establish D(y) ≤ Day(t) < D(y+1), with D = DayFromYear. This selects the largest qualifying year.                                                                                                                                 |
| [§21.4.1.8 DayWithinYear, step 1](https://tc39.es/ecma262/#sec-daywithinyear)              | [55](../../packages/ecma262-abstract/DateOperations.ts#L55)                                                              | Subtract the selected year origin from the day number.                                                                                                                                                                                                     |
| [§21.4.1.9 IsLeapYear, steps 1–4](https://tc39.es/ecma262/#sec-isleapyear)                 | [47](../../packages/ecma262-abstract/DateOperations.ts#L47), [60](../../packages/ecma262-abstract/DateOperations.ts#L60) | Testing divisibility by 4, then 100, then 400 yields the same four cases as the spec's opposite order. DaysInYear returns 366 exactly for true; InLeapYear turns that into 1.                                                                              |
| [§21.4.1.10 MonthFromTime, steps 1–16](https://tc39.es/ecma262/#sec-monthfromtime)         | [65](../../packages/ecma262-abstract/DateOperations.ts#L65)                                                              | Pure year/leap/day calculations may be reordered. Steps 4–14 map to the eleven increasing thresholds. The final bound implements the step 15 invariant; step 16 returns December. The extra January lower-bound check is true throughout the valid domain. |
| [§21.4.1.11 DateFromTime, steps 1–17](https://tc39.es/ecma262/#sec-datefromtime)           | [86](../../packages/ecma262-abstract/DateOperations.ts#L86)                                                              | Steps 1–4 compute the same pure inputs. All eleven step 5–15 month subtractions match. The month invariant at step 16 guarantees the December subtraction at step 17.                                                                                      |
| [§21.4.1.12 WeekDay, step 1](https://tc39.es/ecma262/#sec-weekday)                         | [18](../../packages/ecma262-abstract/DateOperations.ts#L18)                                                              | Epoch day plus four, reduced with nonnegative modulo seven.                                                                                                                                                                                                |
| [§21.4.1.13 HourFromTime, step 1](https://tc39.es/ecma262/#sec-hourfromtime)               | [113](../../packages/ecma262-abstract/DateOperations.ts#L113)                                                            | Floor before modulo 24.                                                                                                                                                                                                                                    |
| [§21.4.1.14 MinuteFromTime, step 1](https://tc39.es/ecma262/#sec-minutefromtime)           | [118](../../packages/ecma262-abstract/DateOperations.ts#L118)                                                            | Private MinFromTime floors before modulo 60.                                                                                                                                                                                                               |
| [§21.4.1.15 SecondFromTime, step 1](https://tc39.es/ecma262/#sec-secondfromtime)           | [123](../../packages/ecma262-abstract/DateOperations.ts#L123)                                                            | Private SecFromTime floors before modulo 60.                                                                                                                                                                                                               |
| [§21.4.1.16 MillisecondFromTime, step 1](https://tc39.es/ecma262/#sec-millisecondfromtime) | [128](../../packages/ecma262-abstract/DateOperations.ts#L128)                                                            | Private msFromTime uses nonnegative modulo 1000.                                                                                                                                                                                                           |

## Integer and division bounds

Every time value in scope is an exactly represented integer below 2^53 in
magnitude. DayFromYear's intermediate counts and sums for the needed years also
fit exactly. Its divisor remainders are separated from integer boundaries by at
least 1/400, far more than binary64 rounding at those small quotients.

For time division, a nonintegral exact quotient is at least 1/divisor from the
nearest integer. Across the supported time range, that exceeds half the largest
binary64 spacing of the quotient:

| Divisor    | Maximum quotient magnitude | Half maximum spacing | Minimum nonzero fractional distance |
| ---------- | -------------------------- | -------------------- | ----------------------------------- |
| 86,400,000 | 100,000,000                | 2^-27                | 1/86,400,000                        |
| 3,600,000  | 2,400,000,000              | 2^-22                | 1/3,600,000                         |
| 60,000     | 144,000,000,000            | 2^-16                | 1/60,000                            |
| 1,000      | 8,640,000,000,000          | 2^-11                | 1/1,000                             |

Correctly rounded division therefore cannot move a value across an integer
boundary before floor. Exact integral quotients remain exact. The private
[mod helper](../../packages/ecma262-abstract/DateOperations.ts#L8) subtracts a
floored multiple; its integer products and differences fit exactly, yielding the
mathematical nonnegative remainder for negative inputs too. Divisions by 7, 24
or 60 in this final reduction have still larger margins relative to their much
smaller quotient spacing.

The year estimate is a finite integer near the supported year range. D(y) is
strictly increasing, with D(y+1)-D(y) equal to 365 or 366. The first correction
loop stops at a year whose origin does not exceed the target day; the second
stops before the next origin. Year increments and day counts remain exact, so
neither loop can stagnate from floating-point rounding. The resulting day within
year is 0–364 or 0–365, which establishes every month/date branch invariant.

Year selection uses the explicit arithmetic of
[§21.4.1.6 TimeFromYear](https://tc39.es/ecma262/#sec-timefromyear), without Date
constructor clipping. The minimum supported instant's year starts outside Date's
range; its numeric origin still fits exactly. This review does not resolve the
separately recorded [time-value witness wording](temporal-spec-issues.md#makeday-witness-range-at-the-minimum-instant)
or sign off MakeDay. Mathematical integer zero may be represented by either JS
zero sign inside these private computations; public Number-returning contracts
retain their own sign requirements.

## Evidence and limits

[date-intrinsics.test.ts](../../packages/ecma262-abstract/tests/date-intrinsics.test.ts)
compares 19,200 date/clock vectors against builtin UTC accessors across years
-200 through 199. Each month contributes the preceding millisecond, its first
millisecond, the next millisecond and an interior date with nonzero clock fields.
This covers a complete 400-year Gregorian cycle, year zero, negative years,
ordinary leap years and both century cases. Year-origin and leap-day counts use
builtin Date arithmetic independently of the shared helpers.

Fourteen additional time vectors cover both supported extrema, adjacent
milliseconds, epoch zero signs and later century boundaries. Direct year-origin
controls include the unclippable minimum-year January origin. Existing mutation
controls verify these helpers keep using captured Math.floor.

AST review identifies consumers in Temporal's kernel and lunisolar arithmetic,
ECMA-402 Calendar/Arithmetic, TemporalDateTime and TimeZoneOffset. Their complete
algorithms remain open. Rust's Gregorian conversion has earlier independent
evidence in the main ledger; this TS module review adds no new Rust signoff.
No new normative inconsistency or implementation defect was found. Broader
Temporal chapter selection and citation migration remain pending clarification.

Validation: all ten Bazel test targets pass (four executed, six cached), plus
Temporal package assembly. These include the shared helper target (43 cases),
helper/Temporal typechecks, existing Temporal kernel oracles, DateTimeFormat
units, Temporal-owned/provider integration tests and the accepted Intl Test262
profile. The profile's known raw data differences remain separate; this review
does not claim zero raw failures. AST lint and historical ledger integrity pass.
No exclusions, baselines, timeouts or executable arithmetic change.
