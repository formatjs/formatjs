# Duration string parsing

Reviewed 2026-11-21. Scope: `Duration.from(string)` parser grammar and bounded
arithmetic in TS and Rust. The [historical index](temporal-spec-audit.md) locates
ParseTemporalDurationString and IsValidDuration in the pinned proposal. Those
references provide navigation only. This is not a Temporal chapter signoff
against the requested ECMA-262 document, whose fetched snapshot lacks those API
chapters. No historical source-line credit is added.

## Grammar correspondence

[TS parsing](../../packages/temporal/duration-core.ts#L133) and
[Rust FromStr](../../crates/temporal/duration.rs#L343) recognize the same language
under ordinary intrinsics:

- Optional ASCII `+`/`-`; ASCII case-insensitive `P`, `T` and unit designators.
- Ordered `Y M W D`, then `T` and ordered `H M S`; no repeated units.
- At least one field. A present `T` requires a time field.
- Only the last supplied time field may have a fraction, including a zero
  fraction. Dot/comma separators require 1–9 ASCII digits. Date fractions fail.
- Whole input must match. TS consumes the complete string by index. Rust consumes
  all bytes. Trailing line terminators are rejected.

TS indexed unit ordering rejects smaller fields after fractional hours/minutes. Rust
requires a fractional field to end the input at
[line 424](../../crates/temporal/duration.rs#L424). Both therefore reject
`PT1.0H0M`, `PT1.0M0S`, missing digits and fractions longer than nine digits.

## Exact arithmetic within accepted bounds

[TS validation](../../packages/temporal/duration-core.ts#L88) and
[Rust construction](../../crates/temporal/duration.rs#L63) require calendar fields
below 2**32 and total day/time magnitude below 2**53 seconds. One overall sign
prevents cancellation. Every accepted whole field is therefore an exactly
representable Number integer; TS decimal digit folding and Rust's f64 field
normalization preserve it. The rejection boundaries are exact powers of two:
rounding a larger positive integer cannot move it below those bounds. Rust's
checked decimal accumulation can overflow only for inputs already outside them.

[TS fractional expansion](../../packages/temporal/duration-core.ts#L168) and
[Rust expansion](../../crates/temporal/duration.rs#L399) scale 1–9 digits to an
integer billionth, multiply fractional hours/minutes by 3600/60, then distribute
exact integer quotients and remainders. Generated lower fields remain small.
Negation follows parsing; TS normalizes negative zero, while Rust integers have
no negative zero.

Consequently `PT9007199254740991.999999999S` is one nanosecond below the maximum
and valid; `PT9007199254740992S` reaches the excluded maximum. Negative twins
have the same boundary. `P4294967295Y` is within the calendar bound;
`P4294967296Y` is outside it. New boundary controls assert these exact fields and
rejections for both signs, alongside mixed weeks, leading zeros and signed zero.

Each whole-number prefix is at most its accepted final value, so every decimal
multiply/add stays exact. Oversized positive integers cannot round below the
power-of-two rejection threshold; there is no cancellation. Fraction accumulation
and padding never exceed 999,999,999 before conversion to BigInt. Hour/minute
scaling then uses BigInt before distribution into bounded lower fields.

## Scanner and observable hooks

- [Sign/prefix:140](../../packages/temporal/duration-core.ts#L140) checks bounds
  before reading a character. Empty and sign-only inputs cannot read inherited
  numeric String properties.
- [Time marker:152](../../packages/temporal/duration-core.ts#L153) permits one T,
  requires following text and switches the unit order to hours/minutes/seconds.
- [Whole digits:160](../../packages/temporal/duration-core.ts#L161) require at least
  one ASCII digit. Signs, whitespace and Unicode digits cannot enter a field.
- [Fraction:167](../../packages/temporal/duration-core.ts#L168) requires 1–9 digits
  after dot/comma; the tenth digit rejects rather than truncating.
- [Unit/order:187](../../packages/temporal/duration-core.ts#L188) requires an actual
  in-range designator and increasing field index. A fractional field must be a
  time field and consume the entire remaining input, including its unit.
- [Validation:215](../../packages/temporal/duration-core.ts#L216) requires a field,
  expands the fraction, applies the overall sign and runs existing range checks.

No scanner operation invokes RegExp, mutable String methods or an iterator.
Private result fields already exist as own data properties. Native delegation
and public object-field coercion are separate unchanged paths.

Five regressions failed before correction: replaced RegExp.exec/test,
String.slice/padEnd and changed legacy RegExp match state. Capturing methods alone
would leave the match-state effect, so the fix replaces regex recognition.
The Reflect.apply mutation control also passes. Five malformed-input controls
check inherited String numeric getters; precision and grammar controls cover
the boundaries above. Three focused gates pass, including 263 API/helper cases.
Expanded validation passes all 45 tests (44 executed, one cached): all 40
Temporal class/backend gates plus duration, relative-duration, zoned, transition
and Rust core controls. Temporal and DurationFormat package assemblies pass.
No baseline, exclusions or timeout changes.

## Remaining work

The scanner correction does not prove isolation of every Duration operation.
Full caller construction, realms, native adapter
errors and authoritative API section mapping remain open.
