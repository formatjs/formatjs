# Gregorian date/day conversion closure

Reviewed 2026-11-22. Builds on
[shared date arithmetic](temporal-date-operations-audit.md), which already maps
ECMA-262 leaves and records their validation. This entry closes the bounded
representation argument needed by CalendarDateAdd's ISO path; it does not claim
complete Temporal API authority/signoff. Direct extended-endpoint controls below
add execution evidence without changing runtime arithmetic.

## Existing leaves and additional domain

Existing audit establishes [ECMA-262 §21.4.1.5 DayFromYear](https://tc39.es/ecma262/#sec-dayfromyear)
steps 1–6, [§21.4.1.9 IsLeapYear](https://tc39.es/ecma262/#sec-isleapyear) steps 1–4,
[§21.4.1.7 YearFromTime](https://tc39.es/ecma262/#sec-yearfromtime),
[§21.4.1.10 MonthFromTime](https://tc39.es/ecma262/#sec-monthfromtime) and
[§21.4.1.11 DateFromTime](https://tc39.es/ecma262/#sec-datefromtime) for its stated
bounds. No duplicate leaf review or claim that private arithmetic functions are
named ECMA-402 operations follows here.

Calendar raw inverse supports integral epoch days within ±110000000, slightly
wider than public PlainDate/Instant range. The direct Gregorian inverse does not
form epoch milliseconds or call YearFromTime. It therefore avoids binary64
spacing/clipping concerns from multiplying extended days by 86400000. Forward
DayFromYear needs years through roughly±303140 for this domain, beyond prior
leaf audit's ±275761. The same formula remains exact over integer years ±400000:
all counts/products/sums have magnitude below 2**28, divisors4/100/400 have
absolute quotients below 101000 (<2**17), and nonintegral remainder distance ≥1/400 greatly exceeds
half binary64 spacing (≤2**−37). Leap divisibility on these exact integers stays
exact. This is a bounded extension argument, not unbounded-year signoff.

## Forward ISO fields to epoch day

[Arithmetic.ts:112–125](../../packages/ecma402-abstract/Calendar/Arithmetic.ts#L112)
uses D(year)+monthStarts[month−1]+leapAdjustment+day−1, where D=DayFromYear.
Month table is cumulative non-leap month length; adjustment adds one iff month>2
and leapyear. Thus valid ISO(year,month,day) maps to its unique integer day offset
from 1970-01-01. Input month/day regulation remains caller's responsibility.
[CalendarISOYear:66](../../packages/ecma402-abstract/Calendar/Arithmetic.ts#L66)
adjusts Buddhist/ROC labels before this calculation; ISO/Gregory/Japanese use
same proleptic civil year. CalendarDateAdd's ISO path uses iso8601 with no label
shift.

Rust [iso_day:588–597](../../crates/intl_datetimeformat_calendars/core.rs#L588)
uses equivalent March-based formula. Let Y=year−(month≤2), era=floor(Y/400),
y=Y−400*era, m=month−3 for March..December or month+9 for January/February.
Then day=146097*era+A(y)+B(m)+date−1−719468, with
A(y)=365*y+floor(y/4)−floor(y/100)+floor(y/400) for0≤y≤400,
B(m)=floor((153*m+2)/5). The final year term is zero for every source within-era
year0..399; it defines the next-era endpoint A(400)=146097.
A counts completed March-based years in Gregorian 400-year era; B contains
March-based month starts. Constant719468 aligns 1970-01-01 to zero. This matches
D/calendar month formula on that anchor and has identical day, month, year and
400-year increments, including year zero/negative eras.

## Inverse and exact bitwise bounds

TS [ArithmeticGregorianFromEpochDay:191–221](../../packages/ecma402-abstract/Calendar/Arithmetic.ts#L191):

1. shifted=epoch+719468, era=floor(shifted/146097), r=shifted−era*146097.
   Euclidean remainder gives 0≤r≤146096 even for negative epochs. Within stated
   domain abs(shifted)<2**27 and abs(era)<2**10; all products/differences exact.
2. y=truncate((r−truncate(r/1460)+truncate(r/36524)−truncate(r/146096))/365).
   This is the unique 0≤y≤399 satisfying A(y)≤r<A(y+1), with A(400)=146097.
   Corrections account for fourth-year leap, nonleap centuries and last leap day
   of 400-year era; final correction prevents false y=400 at r=146096.
3. ordinal=r−A(y), 0≤ordinal≤365. m=truncate((5*ordinal+2)/153) selects0..11;
   date=ordinal−B(m)+1. These Gregorian month blocks give valid day1..28/29/30/31.
4. March month 0..9 becomes civil month 3..12;10..11 becomes1..2. Civil year is
   y+400*era+(civilMonth≤2). This exactly reverses forward's Jan/Feb year shift.

The >>>0 cast sees only0..146096, not negative shifted values. Every |0 cast
sees nonnegative values below 401, and intermediates remain far below 2**31.
No signed32-bit wrapping occurs. Division quotients stay below 1024; distance of
nonintegral quotient from integer is at least1/146097, versus half binary64
spacing below 2**−43. Trunc/floor therefore return mathematical values. All later
multiplications/subtractions are exact integers. Negative handling occurs only
in era floor, never in positive truncated within-era formulas.

## Rust optimized inverse

[core.rs:623–640](../../crates/intl_datetimeformat_calendars/core.rs#L623)
uses same Euclidean era/remainder, but obtains within-era year/ordinal from
[ISO_YEAR_BLOCKS:599–618](../../crates/intl_datetimeformat_calendars/core.rs#L599).
Each block records first day's y,ordinal and March-year length. Year and ordinal
each fit 9 bits; length flag uses bit 18, so packed fields do not overlap. A block
has at most 128 days, shorter than any 365/366-day year; adding remainder can cross
at most one year boundary. next_year predicate and subtraction therefore recover
the exact within-year ordinal. Leap flag matches civil year y+1: y%4==3 except
century 99/199/299, with 399 retained as leap. Last block begins at r=146048 with year399, ordinal317; residual≤48
leaves ordinal≤365<366, so it cannot advance beyond the 400-year era. Month/day/civil-year formulas then match TS.
All arithmetic fits u32/i64; final civil year fits i32 within ±110million days.

## Existing evidence and targeted remaining coverage

[TS kernel.test.ts:137–167](../../packages/temporal/tests/kernel.test.ts#L137)
already exercises 292,194 consecutive days across two complete Gregorian eras,
comparing inverse fields to builtin Date and forward conversion with fixed
13:14:15.987654321 clock to literal nanosecond arithmetic. Kernel inverse calls
this exact ArithmeticGregorianFromEpochDay at kernel.ts:157. This covers every
within-era remainder twice, negative eras, leap/century boundaries and exact
nonzero clock composition. Kernel forward conversion uses its own helper; this
is shared-leaf/kernel evidence, not direct calendar-forward wiring evidence. Prior date audit adds 19,200
independent UTC date/clock vectors over another complete 400-year cycle.

[Rust core.test.rs:295–308](../../crates/intl_datetimeformat_calendars/core.test.rs#L295)
checks valid civil fields and iso_day(iso_fields(day))==day for same 292,194 days
plus public extreme days −100000001 and 100000000. This is broad structural parity
but a paired roundtrip alone is weaker than TS builtin independent expected
fields. Owning Rust core and TS kernel tests pass in this validation.

New [direct TS endpoint controls](../../packages/temporal/tests/arithmetic-calendar.test.ts#L17)
and [Rust controls](../../crates/intl_datetimeformat_calendars/core.test.rs#L310)
assert literal fields and exact forward days at both extended limits:

|  Epoch day | Gregorian date |
| ---------: | -------------- |
| −110000000 | −299200-03-25  |
|  110000000 | +303139-10-10  |

Expectations were independently derived using DayFromYear binary search plus
month-length accumulation, not the production March inverse. These add domain
coverage beyond public Instant limits without another complete-era loop. No
rejection is asserted for unvalidated raw inverse arguments outside the stated
domain; wrapper bounds remain separate.

Validation: four focused targets pass (three executed, one cached): TS arithmetic
calendar, its typecheck, TS kernel and Rust calendar core. Runtime arithmetic,
baselines and fixture corpora stay unchanged. Gazelle and Rust formatting pass.

## Conclusion and limits

No Gregorian arithmetic defect found. Exact forward/March-inverse algebra and
bounded Number/bitwise operations support ISO CalendarDateAdd representation
closure under validated field/day premises. Remaining obligations are caller
bounds and regulation, all NonISODateAdd calendars, native/provider contracts,
private-record/intrinsic isolation, realm behavior and authoritative Temporal
chapter selection. These arithmetic arguments do not sign off those contracts.
