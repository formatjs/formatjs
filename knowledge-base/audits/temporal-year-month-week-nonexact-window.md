# Nonexact day, week, month and year rounding windows

## Current source proof

The current TypeScript and Rust engines both repair a first endpoint that
overshoots and keep advancing a last endpoint that falls short. The proof
covers successful nonexact internal calendar rounding windows for plain
anchors and the zoned profiles bound below. It applies to date-unit
`until` and `since`, relative `Duration.round`, and the retained-prefix
week shortcut after its bracket check. Relative `Duration.total` has its
own equivalent final-bound checks. [TypeScript shared rounding](../../packages/temporal/date-core.ts#L1029),
[Rust shared rounding](../../crates/temporal/calendar_difference.rs#L259),
[TypeScript relative rounding and total](../../packages/temporal/relative-duration.ts),
[Rust relative rounding and total](../../crates/temporal/relative_duration.rs).

### Provider premises

Let D be one civil day, s the direction of the span, and T the target
instant. Dates are valid within the owning calendar and Instant ranges.
Calendar date addition and difference use the same chronology, constrained
addition, and signed date fields. The full unrounded date fields add back
to the nominal origin-clock date N of the instant selected by the
unrounded difference. That instant is at or before T in signed order.
Providers can reject a failed endpoint and no result is claimed for a
throwing path. [Calendar date difference contract](temporal-calendar-date-until-contract-audit.md),
[table chronology](temporal-table-provider-chronology-audit.md).

A nominal zoned endpoint differs from its resolved instant by its effective
offset. This proof assumes its magnitude is less than D. Ordinary and folded
clocks use a real offset. A single forward transition with no interfering
change resolves a compatible gap using its old offset. Plain endpoints use
zero, and zero date fields preserve the exact origin. Two fixed-clock
nominal dates at least 2D apart therefore order strictly in either travel
direction. The generated timezone spacing certificate separates changes
by more than six days, so the exact gap search and shifted candidate have
the single-transition geometry. The certified native Intl host paths use a
checked subday offset from their gap probe. Matching calendar and endpoint
contracts still apply to each profile. [Generated and pinned Node spacing](temporal-timezone-boundary-proof/relative-window-sampler.md).
[JavaScriptCore provider](temporal-timezone-boundary-proof/jsc-provider-audit.md).
[SpiderMonkey provider](temporal-timezone-boundary-proof/spidermonkey-provider-audit.md).

### Inward repair

Dropping smaller date fields and truncating the active field keeps the
first nominal endpoint at or before N in signed order. Equal nonzero
date endpoints use the same original clock and compatible resolution.
A zero date duration preserves the origin, which is already on the
correct side of T. If the first endpoint overshoots, its nominal date U
must therefore be exactly one signed civil day before N. A separation
of at least two days could not reverse under the offset bound.

For day increment one the first endpoint reconstructs the complete
unrounded date and cannot overshoot. A nonzero active count on any other
inward retry moves one signed quantum toward the origin. Day increments
of at least two move at least 2D nominally. Week, month and year quanta
move at least 7D, 5D and 50D under the calendar bounds below. The new
lower instant is before the accepted instant for N. The old overshooting
first endpoint then supplies the upper bound.

If the active count is zero, the first endpoint must have a nonzero
retained prefix to overshoot. Both kernels preserve that endpoint as the
upper bound and shorten the last nonzero prefix field to obtain homogeneous
signed fields. The shortened base is at least 5D earlier than U, so it
is physically before T. Any lower candidate nominally before U is at
least 2D before N and physically before T. A candidate on U is the
overshooting endpoint, while a candidate on N reproduces the accepted
instant. Every candidate after N is at least 2D past U and cannot improve
the lower bound.

Day rebase takes the last requested day increment at or before N and
skips U if that increment lands on it. Month rebase counts ordinal months
between day-one dates, then takes the last requested increment and steps
inward if its constrained nominal day equals U or passes N. This month
probe is no farther nominally than the already validated original next
endpoint, even where a month or year changes length. Week rebase advances
only through candidates at or before T and can stop once the remaining
distance is no greater than the minimum physical week stride. Original
adjacent endpoints still validate before any lower rebase.
[Retained-prefix runtime and public controls](temporal-relative-rounding-contract-audit.md).

### Outward retry and final bracket

After the first-endpoint check, the lower instant is at or before T.
Each outward retry runs only when the upper instant is strictly before
T and uses that checked instant as the new lower bound. Every retry
advances the signed nominal date by a positive calendar quantum in the
finite date range. It reaches a bracket or fails endpoint validation.
This reasoning allows a one-day physical reversal between successive
nominal dates and does not depend on the six-day spread certificate.

When all discarded unrounded probes resolve to instants, a sharper
bound follows. Before any probe correction the local clock adjustment
leaves less than D in signed nominal distance to T's local scalar.
An origin clamp can only reduce that distance. With a resolved rejected
probe the next nominal day after N was past T, less than 3D physically
from the accepted N. For day rounding the initial upper is at least
one nominal day beyond N. Two outward retries take it more than 2D
beyond T's local scalar in the first case. In the rejected-probe case,
the initial upper either coincides with the rejected day, is two days
beyond N, or is already at least two days beyond that rejected day.
Only the middle case can still fall short and one more retry suffices.
For week, month and year rounding the second upper lies at least 5D
beyond N under the calendar bounds below. Its physical distance from
N exceeds 3D, so one outward retry suffices. A probe rejected for
range does not supply an instant for this sharper count.

On a successful nonexact result the checked lower instant A is strictly
before T in signed order and the upper instant B is at or beyond it.
Therefore s(B−A)>0 and 0<s(T−A)≤s(B−A). This proves distinctness and the
progress interval for that final source window. The shared engine can
compare twice the signed distance to the span without dividing.
The retained-prefix week shortcut uses a quotient only behind its
signed bracket check, otherwise it delegates to the same retry.
Relative totals retain a lower bound at or before T and validate their
next bound before exact-return or ratio selection. These are source
invariants and do not establish the literal published retry or
zero-component rules. [Temporal comparison §7.5.34 steps 13–17](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit).

The exact Apia case can still have A=B=T. Both source kernels validate
the original adjacent endpoint and return the exact first count without
division. This leaves the published distinctness assertion false and its
progress undefined for that case. [Exact Apia controls](temporal-day-window-engine-audit.md).

## Overlapping gaps and retained day prefixes

Arbitrary exact providers can resolve a nominal gap by more than D, even
when all their actual offsets are shorter than D. With offsets −23h, 0h
and −22h separated by transitions at epoch hours +9 and +39, nominal
midnight has distinct singleton neighbors. Their shift is +23h. The
shifted clock has two candidates, hours +23 and +45. Compatible chooses
+45, so the effective offset is −45h. Even this profile's six-day spread
of 23h satisfies the spread bound. Transition spacing or an independent
effective-offset proof is also needed.

Add a +16h segment from epoch hours +20 to +39. Use March 1, 2024 at
00:00 UTC as epoch hour zero, and start at February 1 at local midnight.
The target is hour +33, and its unrounded difference is `P1M2DT1H`.
One month adds back to hour +45. Its original three-day upper endpoint
adds back to hour +94. With smallest unit day and increment three, the
old inward repair borrowed one month and used `P30D` at hour +46 as its
lower endpoint. Both endpoints were beyond the target and the literal
progress of that source window was 13. `floor` and `trunc` returned the
wrong-side `P30D`. Retreating one requested day increment gives `P27D`
at hour −25. The retained upper duration `P1M` remains at hour +45.
The checked bracket selects `P27D` for floor/trunc and `P1M` for
ceil/half-even on this witness.
[Packaged replay](temporal-timezone-boundary-proof/relative-window-overlapping-gap-replay.mjs).

For an exact shifted gap, effective displacement is the shift minus the
chosen shifted candidate's real offset, so its magnitude is less than
2D. A fallback that directly subtracts a real offset remains below D.
The wider bound still orders two same-prefix year, month or week endpoints
separated nominally by at least 5D. It does not establish the one-day
offset premise for the old zero-component inward repair. The updated day
and month retry checks its candidate against the target, retreating one
requested quantum while needed. Count zero is the shortened base, at
least 5D in signed nominal distance toward the origin from the overshooting
prefix. The target local clock is at or beyond the accepted nominal date,
which is past that prefix. The target's real offset is less than D, so
the wider 2D bound still puts the shortened base strictly before the target
in signed order. Zero date fields preserve the origin. The retry therefore
reaches a lower bound or propagates an endpoint validation failure without
crossing the shortened prefix. The week retry checks each candidate it
accepts. The covered generated and pinned host profiles retain the preceding
proof. Unbound chronology and timezone resolution remain provider premises.

Build the four packages with Bazel and run the standalone replay on pinned
Node 26.8.1. [Package-path commands](temporal-timezone-boundary-proof/README.md#wide-transition-rounding-replay).

```sh
node knowledge-base/audits/temporal-timezone-boundary-proof/relative-window-overlapping-gap-replay.mjs \
  "$(pkg temporal)" "$(pkg intl-datetimeformat)" \
  "$(pkg intl-localematcher)" "$(pkg fast-memoize)"
```

Packaged replay output SHA-256
`418ba0a53ad89a68c302de93e36caff6f7a9bc178fa9b726cdfd0e2420711efa`.

## Earlier one-retry proof

This earlier argument covered plain anchors and generated zoned profiles
using the six-day offset-spread certificate. The calendar length bounds
and public witness remain useful for the current proof.

### Inputs and local anchors

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
[TS unrounded anchor](../../packages/temporal/zoned-date-time.ts#L534)
[TS shared rounding](../../packages/temporal/date-core.ts#L971)
[Rust unrounded and rounding](../../crates/temporal/calendar_difference.rs#L111).

### Unit lengths and a second upper bound

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
[TS month-code decode](../../packages/temporal/calendar.ts#L224)
[TS constrained addition](../../packages/temporal/calendar.ts#L451)
[TS raw prefix decomposition](../../packages/temporal/calendar.ts#L543)
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

## Historical Duration.round retained-prefix week exception

The earlier Duration.round with largest year or month and smallest week used a
separate quotient shortcut. It validates the first week endpoint and
rounds the original ratio even when the target exceeds that endpoint.
[TS shortcut](../../packages/temporal/relative-duration.ts#L257)
[Rust shortcut](../../crates/temporal/relative_duration.rs#L133).

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

This example historically violated the source progress interval. Current
code delegates when a retained-prefix week window misses the target,
as described above. The rendered assertion conflict and Apia's zero
denominator remain separate.

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
