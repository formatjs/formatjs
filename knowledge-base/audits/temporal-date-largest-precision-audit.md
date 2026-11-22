# Date-largest difference precision scan

Reviewed 2026-11-21 after the time-largest fix. No additional premature
Number/f64 loss was found in the bounded paths below. This is a precision scan,
not a proof of calendar arithmetic, date decomposition or relative rounding.
No runtime edits or new test runs belong to this scan.

## Clock intermediates stay exact

[Plain TS unroundedDifference:807](../../packages/temporal/date-core.ts#L810)
subtracts within-day clocks, then borrows one day when the remainder opposes the
overall sign. Both clocks are in `[0, day)`, so the adjusted signed clock
remainder has magnitude below one day. Balancing at hour starts with a quotient
below 24; subsequent minutes/seconds are below 60 and subsecond fields below 1000. Each integer is exactly representable as Number.
[Rust:122](../../crates/temporal/calendar_difference.rs#L126) uses the same
Euclidean day remainder and borrow, then balances at hour.

[Zoned TS:562](../../packages/temporal/zoned-date-time.ts#L565) also balances at
hour. This scan does not assume its remainder is below one day: repeated dates,
calendar anchoring and overshoot correction need separate proofs. A coarser
public-domain bound is enough for precision. Both the end and a successful
anchor are bounded instants; the overshoot sentinel at line 515 is also bounded
by the epoch limit plus one day. Therefore the remainder's magnitude is below
`1.729e22 ns`, and its hour quotient is below `4.81e9`, well below `2**53`.
Subsequent fields have the same small remainder bounds. Rust's
[anchor/sentinel path:145](../../crates/temporal/calendar_difference.rs#L156)
and hour balance at line 164 satisfy the same coarse bound.

Thus the Number/f64 conversions in these hour-balanced clock fields lose no
integer bits. Later [TS reconstruction](../../packages/temporal/duration-core.ts#L79)
uses BigInt multiplication/summation. Rust's
[Duration::new](../../crates/temporal/duration.rs#L63) round-trip through f64 also
preserves these particular fields, and its
[reconstruction](../../crates/temporal/duration.rs#L138) uses checked i128.
This differs from the repaired time-largest nanosecond path, whose leading
field itself exceeded `2**53` before rounding.

## Plain fixed-day rounding

With plain date/day largest units and time/day smallest units, the
[TS fixed-length branch:1016](../../packages/temporal/date-core.ts#L1026) combines
integer day and clock fields through BigInt. After exact rounding, line 987
converts only the quotient by one day back to Number. For time smallest units,
bounded public endpoints and sub-day rounding keep that day quotient below
`2.01e8` in magnitude. For day smallest units, an increment up to `10**9` can
round beyond the input interval; the quotient still stays below `1.201e9`.
Both bounds are exactly representable. The separately balanced remainder is
below one day.

[Rust:277](../../crates/temporal/calendar_difference.rs#L420) performs the same
calculation in i128 and reconstructs the remainder at hour. Provided the calendar
day field has the required bounded integer value, its intermediate f64
conversion is exact as well. This does not establish that provider arithmetic selected the correct day count.

## Irregular date-unit counts

[TS:942](../../packages/temporal/date-core.ts#L951) uses Number counts and
`trunc(count / increment) * increment` before BigInt endpoint comparisons.
A sufficient precision contract is an integral count with magnitude below
`2**34`, and a positive integral increment at most `10**9`. This comfortably
contains ordinary built-in year/month/week/day counts over the public date
range, including the next increment, but this scan does not independently prove
every calendar provider satisfies that contract.

Under this contract, nonintegral `count / increment` is at least
`1 / increment` from any integer. Correct binary64 division has error at most
`2**34 * 2**-53 / increment`, strictly smaller than that distance, so truncation
cannot cross an integer boundary. Integral quotients are exactly representable.
The truncated product and adjacent increment are bounded integers below
`2**35`, so multiplication/addition remain exact. The quotient used for half-even
parity is then an exact integer. Division by seven in week preparation obeys the
same argument. Rust uses i128 division/products directly in
[lines 199–208](../../crates/temporal/calendar_difference.rs#L243).

Both implementations compare irregular rounding distances and endpoint spans
with BigInt/i128, preserving nanoseconds at half boundaries. Endpoint production
and window monotonicity remain separate algorithm obligations.

## Remaining boundaries

- TS [calendarDateUntilRaw](../../packages/temporal/calendar.ts#L532) returns
  Number calendar counts. Their correctness and bounds across all supported
  calendars still need a separate operation proof.
- Rust [date_until](../../crates/temporal/calendar_difference.rs#L81) promotes
  provider i64 counts to i128 exactly. The provider's
  [DateDuration fields](../../crates/intl_datetimeformat_calendars/core.rs#L50)
  permit much larger values than ordinary calendar differences. The actual
  CalendarProvider trait is sealed; use concrete built-in count bounds rather
  than inferring precision or semantics from these field types alone.
- Repeated-date decomposition, overshoot correction, next-window construction
  and calendar add/until round trips remain open. Exact intermediate arithmetic
  alone does not prove those algorithms select the right date or instant.
- Useful independent controls: plain day-largest spans at both date bounds with
  ±1 ns clock remainders; zoned residuals across long/repeated dates; irregular
  half-window ties ±1 ns. These must use independent endpoint/calendar evidence,
  not expectations derived from the same add/until implementation.
