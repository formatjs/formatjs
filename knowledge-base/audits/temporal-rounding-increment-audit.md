# Temporal rounding-increment audit

Pinned Temporal revision: `b038883fe9c6aa871ccab3238c90daf9eb5e9b17`.
Scope: ValidateTemporalRoundingIncrement lines 430–437 and
MaximumTemporalDurationRoundingIncrement line 722 in
[abstractops.html](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L414-L437).
Nine newly traced numbered lines. No runtime change.

## Validation domain and branches

ValidateTemporalRoundingIncrement accepts a positive integer and integer dividend.
JS callers normalize the increment with roundingIncrement in
[rounding.ts](../../packages/temporal/rounding.ts): undefined becomes 1; unary plus
performs ToNumber; captured truncation precedes finite and 1 through 1e9 checks.
BigInt/Symbol conversions throw TypeError; user abrupt completions propagate.
These inherited GetRoundingIncrementOption traces receive no new credit.

For inclusive validation, maximum is the dividend (430–431). For exclusive
validation, the dividend must exceed one and maximum is dividend minus one
(432–434). Increment greater than maximum rejects (435); nonzero remainder
rejects (436); successful validation returns without a value (437).

- [PlainTime](../../packages/temporal/plain-time.ts), validateIncrement:
  all six dividends exceed one; `increment >= maximum` implements the exclusive
  bound. Number remainder is exact for these small integer operands.
- [Duration](../../packages/temporal/duration.ts), round:
  the same exclusive bounds apply only to time units. Calendar increments still
  have separate balancing and relativeTo requirements outside this helper.
- [Instant](../../packages/temporal/rounding.ts), roundInstantOptions:
  inclusive dividend is nanoseconds per day divided by nanoseconds per unit.
  BigInt comparison/remainder preserve the full integer dividend.
- Rust [time.rs](../../crates/temporal/time.rs), validate_increment, and
  [calendar_difference.rs](../../crates/temporal/calendar_difference.rs),
  validate_options: exclusive equivalents; typed APIs additionally reject zero.
- Rust [rounding.rs](../../crates/temporal/rounding.rs), Instant::round:
  inclusive equivalent in i128, with the independent 1e9 input cap.

The native-only JS branch delegates to Rust before the TS divisor check;
installed native Hermes exercises that path. These helper traces do not sign off
entire public methods, caller ordering or other duplicated caller guards.

## Maximum duration rounding increment

The pinned unit table was parsed with Python HTMLParser. All ten Value/Maximum
pairs match the reviewed TS arrays/branches and Rust enum matches:
year/month/week/day are unset; hour is 24; minute/second are 60;
millisecond/microsecond/nanosecond are 1000.

TS Duration skips the fixed maximum for its first four unit indices; Rust
DateTimeUnit::time returns None for those four units. Both use the six values
above for time units. PlainTime's names/maxima arrays agree with those rows.
Unset means no fixed time-unit maximum, not exemption from the separate 1e9
option limit or caller-specific constraints. The unit table's category and length
columns remain open; value/name columns have separate evidence in the
[unit-name audit](temporal-unit-option-audit.md).

## Validation

34 new Node cases in [rounding.test.ts](../../packages/temporal/tests/rounding.test.ts)
cover all six strict units through PlainTime.round, PlainTime.until and
Duration.round; four reachable inclusive full-day Instant divisors; four
calendar units with increment 1001; coercion, truncation, bounds and abrupt
completion ordering. The 1e9 + 0.9 control must succeed after truncation.
Increment 1,080,000,000 divides a day's nanoseconds but exceeds the separate cap.
A number-hint conversion runs once; later option getters stay untouched on failure.

One public Rust test covers strict and inclusive matrices, the separate 1e9
bound and the unbounded day metadata row. Native Hermes repeats the JS matrices,
all four calendar rows and selected coercion/error controls.

22 Bazel targets pass: Node Instant/PlainTime units, their test typechecks,
implementation typecheck, Rust public tests, native Hermes and all five
Instant/PlainTime/Duration Test262 execution modes. Four targets executed;
18 reused valid cached results. Temporal package assembly also passes.
No exclusions, accepted-failure baselines or test timeouts changed.
