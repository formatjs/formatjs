# ISO CalendarDateAdd: final bounded obligations

Reviewed 2026-11-22. Reviewed current ISO contract map,
Gregorian closure audit, TS canonical calendar path, Rust NumericCalendar/core
and actual callers. No new value/order mismatch found under validated supported
ISO origin, homogeneous-sign DateDuration and valid overflow premises.

Requested [ECMA-262](https://tc39.es/ecma262/) remains authority; its Date leaves
are applicable. Temporal
[CalendarDateAdd §12.3.7](https://tc39.es/proposal-temporal/#sec-temporal-calendardateadd),
[BalanceISOYearMonth §9.5.4](https://tc39.es/proposal-temporal/#sec-temporal-balanceisoyearmonth),
[RegulateISODate §3.5.7](https://tc39.es/proposal-temporal/#sec-temporal-regulateisodate)
and [AddDaysToISODate §3.5.9](https://tc39.es/proposal-temporal/#sec-temporal-adddaystoisodate)
are comparison only. Missing ECMA-262 API chapters prevent authoritative Temporal
section signoff; they do not prevent bounded representation proof below.

## Which dependencies are already bounded

The [Gregorian closure audit](temporal-calendar-gregorian-closure-audit.md) proves forward ISO fields to epoch day, TS March inverse,
Rust packed-block inverse, yearzero/negative eras, exact Number divisions and
bitwise bounds over ±110000000 days. It extends the already-reviewed ECMA-262
DayFromYear/IsLeapYear leaves to integer years ±400000 with explicit arithmetic
bounds. Those are no longer an undifferentiated unresolved Gregorian dependency.
Keep the documented premises and the extended-domain controls below;
do not restart or duplicate existing full-era loops.

The ISO operation map already corresponds every numbered branch. This review
supplies remaining numeric/caller constraints, rather than treating more passing
sample vectors as another whole operation proof.

## Homogeneous-sign numeric bound

Let B=86400000000000 nanoseconds, M=2^53 seconds expressed exactly in
nanoseconds, D=stored duration days, T=exact aggregate clock nanoseconds.
[Duration validation](../../packages/temporal/duration-core.ts#L88) enforces
common sign and |D*B+T|<M; calendar years/months/weeks each have magnitude<2^32.
Number fields are actual stored integers; BigInt preserves those exact values,
without assuming arbitrary mathematical nanosecond fields fit Number.

PlainDate uses D'=D+trunc(T/B), so |D'|<=floor((M−1)/B)=104249991374.
For PlainDateTime's original clock 0≤c<B, D'=D+floor((c+T)/B)=floor((S+c)/B),
where S=D*B+T. Since −M+1≤S+c≤M+B−2 and
M=B*104249991374+27392000000000, |D'|≤104249991375. This ceiling already includes
receiver clock carry; no additional +1 belongs outside it.

If T≥0 the carry is nonnegative; if T≤0 then c+T<B and the carry is nonpositive.
Folding therefore preserves common sign or zero. The BigInt-to-Number carry
conversion is itself exact: common signs bound its magnitude near1.043e11,
well below2^53; adding D remains within the same exact integer domain.

Using the looser PlainDateTime bound for both callers:

```
|7*weeks + D'| <= 7*(2^32−1)+104249991375
                = 134314762440 < 2^37.
```

A normalized Gregorian base at |year|≤400000 contributes fewer than147000000
days. The resulting sum remains below2^38; every product/sum is exact below2^53.
Rust checked i64/i128 operations cover the same domain. This is a public-caller
bound, not permission for arbitrary raw helper values.

After first yearCheck, |year|<=400000. Month serial
12*year+month-1+duration.months has magnitude<2^33. Division by12 has noninteger
distance at least1/12, far above binary64 spacing here. floor and mathematical
mod therefore produce exact balanced year/month, including negative values.

The two ±400000 year guards cannot reject a final supported date under common
sign: a positive year/month displacement beyond the upper range cannot return
with nonnegative weeks/days; negative displacement is symmetric. Original ISO
month/day clipping cannot reverse chronological direction of a nonzero balanced
year/month movement. This argument assumes supported original ISO date (or
stated extended ±110million-day origin), not arbitrary ISODateRecord years.
Raw mixed-sign records are rejected and are outside this proof.

## RegulateISODate ordering and rejected final-date shortcut

[calendar.ts403](../../packages/temporal/calendar.ts#L404) balances year/month.
[calendarToEpochDayRaw313](../../packages/temporal/calendar.ts#L314) receives
normalized month1..12 and original valid day; month clamping is a no-op in this
caller. It evaluates destination month length, then clamps/rejects original day
before [week/day displacement478](../../packages/temporal/calendar.ts#L479).
Integer/year validation and overflow enum checks precede arithmetic.

For constrain, this is compared §3.5.7 steps1.a–1.c. For reject, normalized month
and integer year are already valid, leaving exactly original day versus target
month's length (§3.5.7 step2.b). Returning via Gregorian inverse is equivalent to
record creation under proved conversion premises. No public getters occur in
these prepared primitive fields.

Independent Node v26.5.1 witnesses confirm important ordering distinction:
2021-01-31 +{months:1,days:1} yields2021-03-01 under constrain but throws under
reject; 2021-03-31 +{months:-1,days:-1} yields2021-02-27 under constrain but throws
under reject. Checking only final displaced date would incorrectly accept both
reject cases. Current TS/Rust regulate before displacement and preserve them.

## Complete caller bounds versus raw provider boundaries

AST finds exactly two production addNormalizedCalendarDate consumers:
[date-core576](../../packages/temporal/date-core.ts#L579) and
[YearMonth173](../../packages/temporal/plain-year-month.ts#L173).
The former [addDate569](../../packages/temporal/date-core.ts#L572) applies dayCheck
to the complete result; the latter applies its corrected full-date guard before
wider YearMonth bounds. Raw addCalendarDateRaw is used by calendarDateUntilRaw's
internal trial arithmetic, not proof that its intermediate is a public result.
Bounded addCalendarDate separately guards its returned calendar date.

Actual addDate callers: PlainDate228; PlainDateTime264; ZonedDateTime494;
plain relativeEndpoint131; roundedDateTimeDifference857. They retain final
full-date bounds. PlainDateTime also checks resulting date-time range; zoned
callers perform local-time resolution/final Instant checks separately. Full
range/error semantics of those larger caller operations remain their own audits.

Rust public arithmetic Calendar.add checks input/output days. Typed PlainDate
addition uses that bounded provider, while YearMonth's extended provider result
now receives explicit PlainDate guard. Generic native calendarAdd is intentionally
extended; its caller must apply final public bounds. No extra provider resolution
is introduced by the integer/full-date guard.

Normal public PlainDate bound is inclusive[-100000001,100000000], matching
compared ISODateWithinLimits. Original raw domains±110million and year±400000 are
wider. An intermediate already outside±110million with common-sign remaining
displacement cannot become a supported final ISO date; earlier raw rejection is
therefore harmless in this bounded operation. Unrelated raw consumers are not
implicitly signed off by that argument.

## Exact owning tests and useful incremental controls

- TS direct-helper owner: `//packages/temporal:arithmetic_calendar_test`, sources
  tests/arithmetic-calendar.test.ts and shared arithmetic-calendar-oracle.ts.
  Existing file also checks two400-year cycles through calendar wrappers,
  34366 ICU field rows,32352 addition rows and176 bounds across13 arithmetic
  calendars, plus full-range sampled roundtrips. Existing kernel target
  `//packages/temporal:kernel_test` checks292194 consecutive days with independent
  builtin Date fields and literal clock nanoseconds; kernel intentionally rejects
  ±110million Instant coordinates, so do not test extended domain through it.
- Rust direct-helper owner:
  `//crates/intl_datetimeformat_calendars:calendar_core_test`, core.test.rs.
  Existing iso_fields_round_trip_across_complete_eras295 checks292194 days plus
  public extreme days, month/day validity and forward roundtrip. It previously
  lacked literal expected Gregorian fields at extended endpoints.
  Direct TS ArithmeticGregorianFromEpochDay/ArithmeticCalendarToEpochDay and Rust
  iso_fields/iso_day controls now assert both independently derived literals:
  −110000000 = −299200-03-25 and +110000000 = +303139-10-10. All four focused owning
  test/typecheck/kernel/core gates pass. Existing complete-era loops cover residue
  space; another loop or fixture generator would not add needed domain evidence.
  Raw inverse rejection outside±110million is not an asserted helper contract.

## Closure decision

For supported prepared ISO inputs and validated common-sign Duration arithmetic,
numbered ISO CalendarDateAdd branches, regulation schedule, exact representation
and final caller day bounds have bounded correspondence. Direct-helper
endpoint controls strengthen domain evidence; no runtime repair was required.
Complete public coercion/realm/native routing,
non-ISO/provider policy, unsupported raw-input contracts and requested-authority
boundary remain separately open. No new spec issue or implementation defect found.
