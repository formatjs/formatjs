# Nonexact year, month and week source windows

This source argument covers the shared TypeScript and Rust one-retry
engines for plain anchors and generated zoned profiles. It classifies a
separate Duration week path below. It uses the existing provider
chronology/add-back proofs and the six-day offset-spread certificate.
The published zero-component and retry conflicts retain their own scope.

## Inputs and local anchors

Let D be a civil day, s the signed direction, T the target instant, and y
its local epoch scalar. Unrounded difference begins with the origin-clock
civil floor or ceiling in direction s. For plain anchors this gives a civil
date x with 0 ≤ s(y−x) < D. For zoned anchors use the preceding verified
day comparison. With at most one correction toward the original anchor,
s(y−x) < 2D. Origin clamping can only improve this upper bound. The actual
composed epoch at x is at or before T in signed order. A one-day or larger
separation also compares in signed order under the existing six-day
certificate. These facts are the same prerequisites as the nonexact day
proof. A calendar/provider failure during endpoint construction remains a
throwing path.

The unrounded date fields add back to x. Dropping lower fields and
truncating the active unit count toward zero has a civil endpoint A at
or before x in signed order. If its civil date equals x, the same clock,
zone and compatible resolution reproduce the accepted epoch, or preserve
the original epoch for zero fields. If the dates differ, they differ by
at least D and the existing ordering comparison applies. Thus A does not
overshoot T. Only an upper bound strictly before T triggers the shared
retry. The retry keeps that bound as its new lower endpoint.
[TS unrounded anchor](../../packages/temporal/zoned-date-time.ts#L520)
[TS shared rounding](../../packages/temporal/date-core.ts#L962)
[Rust unrounded and rounding](../../crates/temporal/calendar_difference.rs#L111).

## Unit lengths and a second upper bound

For signed active count n and increment k≥1, the initial count q discards
fewer than k whole units. Hence q + 2ks is at least n + 2s in the signed
direction. The preserved prefix and original date/clock apply to all three
endpoints. For successful constructions:

- **Week.** Any adjacent week endpoints are 7D apart in civil time.
  The unrounded residual after forming n weeks is at most six whole days.
  The rebased upper endpoint is therefore at least 8D beyond x in the
  signed direction. This also covers a retained year/month prefix.
- **Month.** With the retained year prefix fixed, month serials increase
  by one per ordinal month. Constraining the same original day d in
  adjacent months of lengths L and M gives consecutive civil separation
  L−min(d,L)+min(d,M) ≥ min(L,M) ≥ 5 days. The raw month count test picks
  the serial aligned to x's month, or subtracts one signed month when the
  unregulated day would surpass x. In the latter case n+s aligns with x's
  month. For forward travel d > x.day, so n+2 has distance
  L−x.day+min(d,M) ≥ min(L,M) from x. Backward travel has d < x.day,
  and the corresponding distance x.day+M−min(d,M) ≥ M. If n+s is
  already an adjacent month beyond x's, n+2s crosses a full intervening
  month. In all cases n+2s lies at least 5D beyond x.
- **Year.** The raw year estimate aligns to x's year and can retreat once
  when original month code/day or mapped ordinal/day surpasses x.
  The same origin month code is always mapped to its fixed ordinal or to
  its code number plus zero/one leap position. Across consecutive years,
  the mapped ordinal changes by at most one. If n+s aligns to x's year
  and was rejected by its raw code/day or mapped ordinal/day, the mapping
  in the year of n+2s can lag x's ordinal by at most one in the direction
  of travel. The remaining months in one year and preceding months in
  the other include at least 12−2 complete months. With minimum month
  length five days that gives at least 50D. If n+s is already in the next
  year in the travel direction, n+2s crosses a full intervening year.
  The same ordinal bound gives at least 50D between consecutive actual
  endpoints using the same origin month code.

The calendar bounds follow from the arithmetic, lunisolar and table
provider chronology proofs. Shortest month is the Coptic/Ethiopic/
Ethioaa month 13 of five days. These providers have at least twelve
ordinal months per year. Month-code comparison preserves ordinal order
within each actual year. The checked constrain fallback for absent leap
codes moves the mapped ordinal by at most one under the named formulas.
[TS month-code decode](../../packages/temporal/calendar.ts#L223)
[TS constrained addition](../../packages/temporal/calendar.ts#L450)
[TS raw prefix decomposition](../../packages/temporal/calendar.ts#L532)
[Rust prefix decomposition](../../crates/intl_datetimeformat_calendars/date_math.rs#L60),
[Rust month-code fallback](../../crates/intl_datetimeformat_calendars/table_calendar.rs#L267).
For Chinese and Dangi, an absent leap code is constrained to its ordinary
month number. Its ordinal increases by one exactly when the actual leap
month precedes it. A present leap code is one position after its ordinary
month. Hebrew M05L always uses ordinal six. Regular Hebrew codes M06
and later shift by one in leap years. The [ordinal check](temporal-year-month-ordinal-check.py)
covers both directions, including raw code order versus actual ordinal.
Fixed calendars preserve each code's ordinal.

Even the weakest rebased upper bound above is at least 5D beyond x.
Since y is less than 2D beyond x, the new upper bound is beyond y by
more than 3D. Both effective offsets are strictly within one day of
zero, so this signed comparison remains strict at the instant level.
Consequently the shared engine always brackets T after at most one
successful retry for these units. Adjacent month/year/week endpoints
differ by at least 5D in civil time and by more than 3D physically, so
steps 13 and 17's distinctness and progress assertions follow on the
scoped nonexact shared path. The Node ICU certificate extends the timezone premise to the exact host
profile, subject to the same calendar contracts.

## Duration.round retained-prefix week exception

Duration.round with largest year or month and smallest week uses a
separate quotient shortcut. It validates the first week endpoint and
rounds the original ratio even when the target exceeds that endpoint.
[TS shortcut](../../packages/temporal/relative-duration.ts#L253)
[Rust shortcut](../../crates/temporal/relative_duration.rs#L132).

A public nonzero-prefix witness uses America/New_York:

- Origin: 2020-09-25T01:30−04:00.
- Input Duration: 1 month, 6 days, 24 hours, 30 minutes.
- Display options: largest month, smallest week, increment 1.
- Retained prefix endpoint A: 2020-10-25T01:30−04:00,
  1603603800000000000ns.
- Initial upper B: earlier 2020-11-01T01:30−04:00,
  1604208600000000000ns.
- Actual target T: later 2020-11-01T01:00−05:00,
  1604210400000000000ns.

The unrounded date target borrows a day because 01:00 precedes 01:30.
The count is therefore zero weeks after retaining the month. The
shortcut's progress is exactly 606600000000000/604800000000000 =
337/336, which lies above one. The common engine would rebase to
one and two weeks. The same witness with 2019-10-25 origin and one
retained year reaches identical A, B and T.

The public distinction from native Node exists for ceil and expand.
The Bazel-built host and standalone package entries return P1M2W/P1Y2W.
Native Node returns P1M/P1Y. The intended rebased direction selects the two-week
result. The published week branch ignores the retry shift, so this
native difference does not establish a required public result.
For these witnesses the FormatJS shortcut agrees with the intended
rebased window for all nine modes. Other modes choose one week.
[Existing rendered retry conflict](temporal-week-retry-spec-issue.md).

For well-bounded successful endpoints, the shortcut can be output
equivalent even though its implied progress is outside [0,1]. If the
initial upper B lies strictly before T in signed order, B's civil scalar
lies at least D beyond x. Thus y is less than D beyond B's civil scalar.
If B and y differ by more than 2D in the other direction, B could not
physically lie before T. Otherwise the six-day spread bound applies,
giving signed physical overshoot T−B of less than 2D. Both original and
rebased week spans exceed 5D. The target is less than halfway into the
rebased interval, and the shortcut's extra positive progress beyond
one is likewise below 1/2. Nearest modes choose B either way; signed
directed modes choose B or the same next whole-week count. This only
applies when the rebased upper construction succeeds. The [endpoint proof](temporal-retained-week-endpoint-validity.md)
supplies that range guarantee for the certified profiles. The New York
witness establishes an assertion divergence and matching intended output.

Keep the bracketing assertion separate from output equivalence. Step 17
has a concrete source exception in this path and a separately documented
rendered assertion conflict. A global exact-target proof remains blocked
by Apia's zero denominator. Other host/provider profiles need their own
six-day and calendar contracts.

## Reproduction

The [Node ICU offset certificate](temporal-timezone-boundary-proof/node-icu/temporal-node-icu-six-day-spread-proof.md)
supplies the six-day premise for the hashed built-in Intl provider. The
[ordinal check](temporal-year-month-ordinal-check.py) enumerates 52,416
Chinese/Dangi and 650 Hebrew leap-position cases for the cited formulas.
It checks both signed ordinal inequalities.

With Node 26.5.1, build and resolve the package through Bazel, then run
the fold witness. [Captured results](temporal-week-fold-window-observed.json)
cover the host and standalone package entries and native Node Temporal.

```sh
bazel build //packages/temporal:pkg
pkg_path="$(bazel cquery --output=files //packages/temporal:pkg)"
node knowledge-base/audits/temporal-week-fold-window-reproduce.mjs "$pkg_path"
python3 knowledge-base/audits/temporal-year-month-ordinal-check.py
```
