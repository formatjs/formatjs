# ISO CalendarDateUntil: finite-prefix proof

Reviewed 2026-11-22. Sources:
[TS calendar.ts:531–600](../../packages/temporal/calendar.ts#L531),
[Rust date_math.rs:60–115](../../crates/intl_datetimeformat_calendars/date_math.rs#L60).
AST review verifies month assignment and typed until_raw body. Gregorian
conversion closure and validated
integer endpoints supply premises below.

Requested ECMA-262 snapshot lacks Temporal API chapters.
[Published comparison §12.3.9](https://tc39.es/proposal-temporal/#sec-temporal-calendardateuntil)
literal week/day loops are blocked by documented
[§3.5.6 ISODateSurpasses](https://tc39.es/proposal-temporal/#sec-temporal-isodatesurpasses)
zero-month shortcut defect. This proves intended finite prefix contract,
conditional on correcting that helper's week/day handling while preserving its
year/month raw-tuple policy. It is not proof of equivalence to nonterminating
literal text or an adopted authority change.

## Premises and intended result

Let a,b be integer epoch days within[-110000000,110000000]. Their exact Gregorian
fields are A=(y,m,d), B=(Y,M,D), with valid calendar dates and padded ISO month
codes M01..M12. Let s=sign(b−a). Largest is year/month/week/day. For s≠0, seek:

- Maximal signed whole-year/month prefixes under unregulated tuple comparison
  used by ISODateSurpasses, retaining original day when comparing candidates.
- Actual constrained date anchor between a and b, then exact residual days.
- Every nonzero output field has sign s. Adding result to a under constrain
  recovers b in the same raw coordinate domain.

“Maximal” does NOT mean maximal constrained-add epoch prefix. Example
2020-02-29->2021-02-28: constrained+1year reaches target, but unregulated Feb29
surpasses Feb28 and is excluded. Current decomposition is0years11months30days.
This is not a newly discovered failure; it is the compared prefix policy.

## Equal endpoints

TS540–544/Rust61–66 convert both valid endpoints, then return four zeros ifs=0.
No year/month arithmetic or date addition. Private zero fields are canonical
positive zero; TS week reduction later also normalizes negative zero.

## Maximal years

Only largestyear enters TS572–575/Rust93–98. Initial q=Y−y has sign s orzero.
Adding q years aligns candidate year to Y. Comparing unregulated remaining
(m,d) with(M,D) decides whether it passes in direction s.

- If not past, q is accepted. q+s has year Y+s, strictly beyond B whatever its
  remaining valid month/day, so q is maximal.
- If past, subtract s once. Candidate year is Y−s, strictly on origin side ofB;
  q−s accepted, next q rejected. No second correction required.
- A zero-year q cannot be rejected: chronological ordering of valid dates within
  one year agrees with month/day ordering. Subtracting s cannot introduce a
  year field of opposite sign.

TS compares primitive fixed-width ISO month codes through native relational
operators; [ECMA-262 §7.2.12 IsLessThan](https://tc39.es/ecma262/#sec-islessthan)
string handling supplies code-unit order without user coercion callbacks for
these prepared strings. M01..M12 order equals
numeric month order. Rust compares numeric code number then leap flag; ISO flag
isfalse, so predicates agree. The second balanced year/month comparison with
months0 yields same tuple; no clamp changes the day used for this prefix test.

Largestmonth/week/day keep year fieldzero. Its original date cannot surpass B
in direction s, which supplies same accepted-prefix invariant for next stage.

## Maximal months and one correction

For largestyear/month, accepted year prefix k isfixed. Let U=y+k and original
month m. ISO addYearMonth(U,m,0) leaves month unchanged. TS576–588/Rust99–106
compute

```
p = (12*Y+M−1) − (12*U+m−1).
```

Thus candidate(p) aligns year/month exactly to(Y,M), retaining unregulated d.
Accepted year prefix ensures p has sign s orzero. Surpasses' first year-prefix
check is alreadyfalse and independent ofp. Its balanced candidate comparison
therefore reduces to s*(d−D)>0:

- If false, keep p. p+s moves to adjacent year/month beyond target's year/month;
  original d cannot change that strict month ordering. p maximal.
- If true, choose p−s. This moves to preceding month in direction s, strictly on
  origin side of target month. Next p is rejected, so one correction suffices.
- p=0 cannot require correction. If it did, already-accepted year prefix would
  have same year/month and surpassing original day, contradiction. Hence output
  months never acquire opposite sign.

For largestyear the accepted year-prefix condition bounds final |months|≤11.
If provisional p has magnitude12, same-month day mismatch caused year decrement
and forces month correction to11. For largestmonth, month count may span whole
domain; it remains bounded/exact as below.

## Constrained anchor and residual common sign

TS589–593/Rust107 apply original date plus accepted k years/p months using
constrain, with weeks/days0. Let c be epoch of resulting date. Balancing fixes
candidate year/month, then clamps d to that month's length.

For s=+1, candidate's unregulated tuple≤B. If month precedes target, any valid
clamped day stays earlier; if same month, d≤D and clamp cannot increase it.
Thus c≤b. For s=−1, candidate tuple≥B. If month follows target, any valid day
stays later; if same month, d≥D and monthLength≥D, so min(d,monthLength)≥D.
Thus c≥b. Year/month movements have sign s, so constrained anchor also cannot
move behind a in opposite direction. Therefore c lies in closed interval[a,b]
(with order reversed ifs<0).

TS595/Rust109 set residualr=b−c. It has sign s orzero. Add-back is exact:
CalendarDateAdd(a,{k years,p months,r days},constrain) performs same constrained
month anchor then r integer epoch days, yielding c+(b−c)=b. Candidate anchor and
result both stay in validated raw domain because they lie between endpoints;
no ±110million conversion guard rejects them. All date fields remain homogeneous.

Largestday uses c=a directly, so residual=b−a with same proof and no month work.

## Week decomposition

Largestweek skips years/months. Set δ=b−a. TS596–598/Rust110–112 compute
w=truncate(δ/7), r=δ−7w (TS signed remainder, normalizedzero).
Both have sign s orzero, |r|<7, and a+7w lies between a,b. The next signed week
passes b, since |r|<7; w is maximal and remaining r days exactly reaches b.
Day-only δ is likewise maximal whole signed day count.

This direct reduction avoids literal comparison loop's zero-month defect.
It does not implement infinite iteration or claim the published helper already
states a terminating result.

## Exact arithmetic and finite bounds

Raw endpoints differ by at most220million days (<2**28); sign and subtraction
exact. Gregorian years lie between−299200 and303139; year difference<2**20,
absolute month serial difference<2**23. All Number year/month additions,
serial products, comparisons and corrections remain exact. addYearMonth's
floor(serial/12) quotient has magnitude<2**20; fractional gap≥1/12 dwarfs
binary64 half-spacing. Supported intermediate years stay below400000 guard.

Week quotient magnitude≤31428572 (<2**25); noninteger distance≥1/7 exceeds
half-spacing≤2**−29. Truncation cannot cross integer boundary. Integer signed
remainder is exact. Rust i64 arithmetic comfortably covers same bounds; checked
addYearMonth/date arithmetic does not overflow on these inputs.

Termination is finite: no data-dependent prefix increment loops. Calendar
conversion uses bounded Gregorian formulas; one year correction, one month
correction, one constrained anchor and constant residual arithmetic suffice.
Native/provider dispatch must satisfy its own contract; this proof targets
current canonical TS and Rust NumericCalendar ISO algorithms.

## Evidence and remaining work

Existing arithmetic-calendar.test.ts79 covers ISO/all arithmetic calendars,
several origins including0, ±1/±29/±365/±800 displacements and all largestunits;
asserts common sign/no negativezero/exact add-back. Existing full-era Gregorian
controls establish field conversion. Those tests do not alone prove maximal
unregulated prefixes; algebra above supplies that conditional argument.

No actual arithmetic/common-sign/maximal-prefix defect found under premises.
Do not generalize ISO tuple proofs to Hebrew leap codes or other calendar
providers. Full non-ISO difference decomposition, caller coercion/native/realm
contracts and authoritative correction of ISODateSurpasses remain separate.
[Ten literal prefix controls](../../packages/temporal/tests/arithmetic-calendar-oracle.ts#L18)
cover leap/month-end asymmetry, largest-unit
distinctions and both extended raw endpoints. They assert full components and
raw add-back through shared TS/Hermes/native controls and typed Rust. All 12 focused targets pass (three executed, nine cached);
[target manifest](temporal-date-until-validation-targets.txt). No historical trace credit or full method signoff claimed.

## Independent step evidence

The PlainDate entry points pass the validated receiver, original operand and
options to the shared difference. Both keep the starting operand first.
`until` passes false for since and `since` passes true. Native preparation
keeps the same ISO days, calendar, largest date unit and operation.
[Temporal comparison §3.3.25 step 3](https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.until).
[Temporal comparison §3.3.26 step 3](https://tc39.es/proposal-temporal/#sec-temporal.plaindate.prototype.since).
[TypeScript until](../../packages/temporal/plain-date.ts#L415).
[TypeScript since](../../packages/temporal/plain-date.ts#L421).
[Rust until](../../crates/temporal/plain_relative.rs#L85).
[Rust since](../../crates/temporal/plain_relative.rs#L96).

Unequal PlainDate endpoints dispatch CalendarDateUntil with the preserved
calendar, ordered days and selected largest unit. Where the implementation
uses midnight scalars, the clock remainder is zero and day borrowing does
not alter either endpoint. CalendarDateUntil's result and rounding still
have their own audit obligations.
[Temporal comparison §3.5.14 step 6](https://tc39.es/proposal-temporal/#sec-temporal-differencetemporalplaindate).
[TypeScript arguments](../../packages/temporal/plain-date.ts#L267).
[Rust arguments](../../crates/temporal/plain_relative.rs#L123).

Both ISO year/month prefix predicates run before week or day fields are
assigned. A false balanced-month comparison therefore completes the
zero-week/day case in step 9. After the retained prefix is selected, constrain
regulates the original day in the balanced ISO year/month. This value is
invariant across the residual week/day probes. Both backends use seven calendar
days per week. These facts verify the independent operations in steps 9–11.
The zero-month shortcut and the published week/day loop stay open.
[Temporal comparison §3.5.6 steps 9–11](https://tc39.es/proposal-temporal/#sec-temporal-isodatesurpasses).
[TypeScript prefix](../../packages/temporal/calendar.ts#L610).
[Rust prefix](../../crates/intl_datetimeformat_calendars/date_math.rs#L91).
[TypeScript constrain and week](../../packages/temporal/calendar.ts#L508).
[Rust constrain and week](../../crates/intl_datetimeformat_calendars/date_math.rs#L52).

Nine focused Bazel gates pass across TypeScript, Rust and Hermes. Only comments
and audit records changed. The fixture oracles validate existing behavior.
[Exact test scope](temporal-relative-rounding-contract-audit.md#independent-step-evidence).

- Bazel log SHA-256 `0eb542982068c77ccaf47c7fe3714de93d24d242541616e949e6756931d2fa93`
