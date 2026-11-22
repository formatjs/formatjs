# Built-in calendar counts and a collapsed day window

Reviewed 2026-11-21. Read-only source mapping and independent endpoint arithmetic.
No new runtime defect or full calendar-provider signoff is claimed.

## Built-in count bounds

[TS calendarDateUntilRaw:540](../../packages/temporal/calendar.ts#L540) gets two
raw calendar dates; years are their year difference with a one-unit adjustment,
months are serial differences with a one-unit adjustment, and days are an
integer epoch-day residual. Weeks divide that residual by seven. Rust's
[NumericCalendar::until_raw](../../crates/intl_datetimeformat_calendars/date_math.rs#L60)
uses the same structure in i64.

Actual supported calendar engines have these finite coordinate domains:

- [Raw TS day conversion:372](../../packages/temporal/calendar.ts#L372) and
  [Rust:326](../../crates/intl_datetimeformat_calendars/core.rs#L326) bound input
  days by ±110,000,000. The built-in arithmetic year estimates and Gregorian
  offsets cover this finite domain, rather than arbitrary i64 calendar labels.
- [TS addYearMonth:410](../../packages/temporal/calendar.ts#L410) checks resulting
  years against ±400,000; the same bound appears in
  [Rust check_year](../../crates/intl_datetimeformat_calendars/core.rs#L543).
  Successful ordinary year differences therefore stay around 800,000, not near
  binary64's integer precision limit.
- [TS calendarMonthSerial:517](../../packages/temporal/calendar.ts#L517) uses
  twelve/thirteen months per year or Hebrew elapsed months.
  [Rust months_before_year:389](../../crates/intl_datetimeformat_calendars/core.rs#L389)
  checks years and uses `235 * year / 19` for Hebrew. The coarse ±400,000-year
  domain bounds serial differences below 10.5 million months.
- Chinese/Dangi use packed calendar data. Their
  [generator:25](../../packages/intl-datetimeformat/scripts/calendar-data/lunisolar.rs#L25)
  covers ±110 million days with whole years, asserts sequential year/month
  ordinals, months of 29/30 days and 12/13 months per year, and accumulates month
  checkpoints as u32. Its span contains fewer than 7.6 million months.
  [TS month differences:187](../../packages/temporal/calendar-table.ts#L187)
  subtract these bounded serials. The
  [Rust table constructor:67](../../crates/intl_datetimeformat_calendars/table_calendar.rs#L67)
  independently validates year bounds, patterns and day/month checkpoints.

For successful raw add/until round trips, the residual day count is bounded by
about 220 million days; weeks by about 31.5 million. Those round trips remain a
calendar-correctness obligation. Even the looser direct bound from ±400,000-year
built-in formulas is far below `2**34` days. Adding the permitted next rounding
increment, at most one billion, remains an exactly representable integer.
Consequently these shipped count magnitudes satisfy the sufficient division/
truncation precision contract in the [date-largest scan](temporal-date-largest-precision-audit.md). This is a numeric
bound, not proof that month codes, leap months or era transitions are correct.

[CalendarProvider is sealed](../../crates/temporal/calendar_provider.rs#L11):
arithmetic calendars, validated table calendars and CalendarRef are the supported
Rust routes. Arbitrary external implementations cannot supply counts. Host-calendar
modes keep separate host-data contracts. Concrete provider bounds establish
numeric magnitude; complete calendar/round-trip semantics require their own proofs.

## Apia: adjacent day counts need not have distinct endpoints

Pinned [IANA tzdb 2026f, australasia](https://data.iana.org/time-zones/tzdb-2026f/australasia)
changes Apia's standard offset from −11 to +13 at the end of December 29, 2011.
The active +1-hour DST rule makes the total shift −10 to +14, skipping December 30. Under compatible gap resolution, December 30 at noon becomes December 31
at noon.

Take origin `2012-01-01T12:00+14:00[Pacific/Apia]` and destination
`2011-12-31T10:00+14:00[Pacific/Apia]`. Offset subtraction gives:

| Value                            | UTC instant       |   Epoch nanoseconds |
| -------------------------------- | ----------------- | ------------------: |
| Origin                           | 2011-12-31T22:00Z | 1325368800000000000 |
| Destination                      | 2011-12-30T20:00Z | 1325275200000000000 |
| Origin minus one calendar day    | 2011-12-30T22:00Z | 1325282400000000000 |
| Origin minus two calendar days   | 2011-12-30T22:00Z | 1325282400000000000 |
| Origin minus three calendar days | 2011-12-29T22:00Z | 1325196000000000000 |

The initial unrounded date/time difference is −1 day and −2 hours. Rounding by
one day initially constructs the identical −1-day and −2-day endpoints. The
source's one-window retry moves to counts −2 and −3:
[TS:952](../../packages/temporal/date-core.ts#L952) and
[Rust:218](../../crates/temporal/calendar_difference.rs#L252).
That window spans 24 hours, with the destination two hours from its nearer
−2-day endpoint. Thus half modes/trunc select `-P2D`; floor/expand select `-P3D`;
ceil selects `-P2D`. Since applies the opposite signed rounding direction, giving
`P2D` for half modes/trunc/floor and `P3D` for ceil/expand.

Reversing the endpoints changes the calendar anchor. Starting at December 31
at 10:00, one day lands January 1 at 10:00, two hours before the destination;
two days land January 2. The forward nearest result is therefore `P1D`, not the
negation of the backward nearest result. Tests must not assume antisymmetry for
these calendar-relative differences.

The shared oracle controls check the three hardcoded backward endpoints
and all nine rounding modes in both until/since directions. Expectations follow
these UTC endpoints and signed distance comparisons; they are not generated by
the production rounding helper. Fixture counts stay unchanged.

This demonstrates a handled collapsed initial window. It does not prove a single
retry suffices for every possible provider or every shipped historical zone.
That requires the unrounded-decomposition and timezone-transition contracts;
whole-date skips already rule out a global strict-monotonicity assumption.

The published proposal's day branch ignores the retry shift, so it repeats the
collapsed window and violates its own assertions for this witness. That
[inconsistency is recorded separately](temporal-spec-issues.md#day-window-retry-ignores-shift-after-apias-skipped-date).
FormatJS's existing all-date-unit shift is a practical fallback; this audit does
not present it as a complete derivation from that published algorithm.
