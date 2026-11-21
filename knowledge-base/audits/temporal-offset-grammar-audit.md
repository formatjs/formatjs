# UTC-offset grammar and operations

Reviewed 2026-11-21 against published ECMA-262: [§21.4.1.33](https://tc39.es/ecma262/#sec-time-zone-offset-strings),
[§21.4.1.33.1 IsTimeZoneOffsetString](https://tc39.es/ecma262/#sec-istimezoneoffsetstring)
and [§21.4.1.33.2 ParseTimeZoneOffsetString](https://tc39.es/ecma262/#sec-parsetimezoneoffsetstring).
The two abstract-operation contracts and their grammar are reviewed. Public
Temporal caller algorithms, other date/time productions and realm requirements
remain open. This adds no historical Temporal source-line credit.

## Grammar

[UTCOffsetNanoseconds](../../packages/ecma262-abstract/UTCOffsetNanoseconds.ts#L4) accepts exactly
ASCII sign followed by two hour digits, optionally minute digits, optionally
second digits with a decimal fraction. Hour is 00–23; minutes and seconds are
00–59. Extended syntax requires both separators to be colons; basic syntax has
neither. Fractions follow seconds only, use dot or comma, and contain one through
nine ASCII digits. The referenced [§12.9.3 DecimalDigit](https://tc39.es/ecma262/#sec-literals-numeric-literals)
production contains only 0–9.
Every successful branch consumes the entire input. Whitespace, Unicode signs or
digits, leap seconds, mixed separators and suffixes fail recognition.

The scanner checks length before every code-unit read. Out-of-range access would
consult String.prototype numeric properties; regression controls poison those
properties at short-input and maximum-input boundaries. No mutable String or
RegExp method participates in the operation.

Rust [Cursor::time](../../crates/temporal/parse.rs#L36) enforces the same fields,
separator mode and fraction bounds with checked byte access. Cursor::offset
requires an ASCII sign. The standalone offset_nanoseconds wrapper requires full
consumption. Embedded ISO parsers share that cursor but validate their surrounding
grammar separately; their complete productions remain open.

## Step mapping

| Contract                         | TypeScript evidence                                                                                                                                                                                                                                              | Rust evidence                                                                                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §21.4.1.33.1 steps 1–3           | [TS:25](../../packages/temporal/instant-string.ts#L25). isTimeZoneOffsetString returns false exactly when the bounded scanner rejects; otherwise true.                                                                                                           | [Rust:90](../../crates/temporal/parse.rs#L90). offset_nanoseconds returns an error for invalid grammar or an unconsumed suffix. No separate Boolean wrapper is needed internally. |
| §21.4.1.33.2 steps 1–2           | [TS:32](../../packages/temporal/instant-string.ts#L32). The same scanner validates the complete UTCOffset before returning a value. The throwing wrapper extends the valid-input contract to invalid caller input.                                               | [Rust:90](../../crates/temporal/parse.rs#L90). Cursor plus full-consumption guard validates the complete input.                                                                   |
| Steps 3–6, including 5.a and 6.a | [TS:10](../../packages/ecma262-abstract/UTCOffsetNanoseconds.ts#L10). Required sign code unit selects negation.                                                                                                                                                  | [Rust:75](../../crates/temporal/parse.rs#L75). Cursor::offset takes ASCII minus or plus and applies the sign once.                                                                |
| Step 7                           | [TS:53](../../packages/ecma262-abstract/UTCOffsetNanoseconds.ts#L53). Every intermediate integer is below 86,400,000,000,000, hence exactly representable as Number. The Temporal wrapper converts that integer through captured BigInt exactly.                 | [Rust:81](../../crates/temporal/parse.rs#L81). i128 arithmetic safely represents every bounded intermediate.                                                                      |
| Steps 8–10                       | [TS:20](../../packages/ecma262-abstract/UTCOffsetNanoseconds.ts#L20). pair(1, 23) requires exactly two ASCII hour digits.                                                                                                                                        | [Rust:37](../../crates/temporal/parse.rs#L37). number(2) and time's hour bound.                                                                                                   |
| Steps 11–12.b                    | [TS:23](../../packages/ecma262-abstract/UTCOffsetNanoseconds.ts#L23). Missing minute starts at zero; otherwise pair(index, 59) converts both digits.                                                                                                             | [Rust:38](../../crates/temporal/parse.rs#L38). Missing minute starts at zero; otherwise number(2) and minute bound.                                                               |
| Steps 13–14.b                    | [TS:24](../../packages/ecma262-abstract/UTCOffsetNanoseconds.ts#L24). Missing second starts at zero; otherwise the same bounded pair conversion.                                                                                                                 | [Rust:47](../../crates/temporal/parse.rs#L47). Missing second starts at zero; offset mode limits seconds to 59.                                                                   |
| Steps 15–16.d                    | [TS:25](../../packages/ecma262-abstract/UTCOffsetNanoseconds.ts#L25). Missing fraction starts at zero; supplied digits accumulate in decimal, then multiply by ten to width nine. This equals the specified padded substring's integer, including leading zeros. | [Rust:52](../../crates/temporal/parse.rs#L52). The same bounded decimal accumulation followed by 10^(9-digitCount).                                                               |
| Step 17                          | [TS:54](../../packages/ecma262-abstract/UTCOffsetNanoseconds.ts#L54). Weighted hour/minute/second total plus fraction; apply sign; return exact Number nanoseconds. The Temporal wrapper returns BigInt and normalizes negative zero to integer zero.            | [Rust:81](../../crates/temporal/parse.rs#L81). Same weighted expression in i128.                                                                                                  |

Assertions constrain valid input; the implementation need not allocate parse nodes
or intermediate strings. The arithmetic and recognition equivalence above covers
every valid production, including absent components and both sign branches.

## Integrations

AST review found generic TypeScript parser calls in instant-string.ts,
relative-duration.ts and zoned-date-time.ts. Minute-only calls occur in annotation
and zone-string parsing, zones.ts and the ZonedDateTime constructor. Their input
preparation and observable public sequencing remain caller work. Generic offsets
with seconds stay valid; minute-only contexts reject them, including zero seconds.

The fixed-zone constructor and zone helpers now classify offsets without private
RegExp reads. Canonicalization uses captured decimal formatting instead of mutable
global String and String.prototype.padStart. Named-zone regular expressions and
case conversion remain open.

Rust FFI prepared-field and resolveZonedDateTime paths use the standalone parser.
Other ISO inputs use Cursor::offset. Registry offset_identifier separately accepts
only sign/hour or sign/hour/minute forms, checks ASCII digits and component bounds,
then canonicalizes zero to +00:00. Public registry controls cover that narrower
context. Native Hermes shares Rust parsing through the existing FFI.

## Evidence

Five original mutation regressions failed; the helper's RegExp.test control
already passed. After the scanner change, two constructor cases still failed,
identifying its separate regex gate. All six now pass. Installed native Hermes
repeats public fixed-zone controls for RegExp.exec, RegExp.test, global String
and String.prototype.padStart, restoring each property before assertions.

TypeScript compares 2,888 valid boundary combinations with an independent Temporal
implementation. Forty malformed strings exercise full-input rejection. Additional
cases distinguish generic and minute-only grammar and poison String.prototype
numeric indices. Rust public Instant, registry and direct FFI controls independently
check exact signed nanoseconds, canonical zero and malformed/trailing input.
Native controls cover signed extrema, fractions and minute-only rejection.

No spec inconsistency found in these sections.

## Validation

All 75 Bazel test targets pass (61 executed, 14 cached), including all 40
class/backend Test262 gates, Rust, native Hermes and Node/native ICU string
oracles. Temporal package assembly also passes. The focused TypeScript target
passes 251 cases; Rust core passes 58 and FFI passes 15. AST lint and historical
ledger integrity pass. No exclusions, baselines or timeouts changed. Existing
raw Intl data differences remain separate from accepted profile-gate results.

## Shared scanner and DateTimeFormat integration

The [scanner](../../packages/ecma262-abstract/UTCOffsetNanoseconds.ts#L4) now lives
in the leaf ecma262-abstract package. Its body is unchanged from the audited
Temporal implementation; only its export/name and default minuteOnly argument
change. Temporal's Boolean/throwing wrappers retain explicit false/annotation
arguments, captured BigInt conversion and existing error behavior.

[ToLocalTime:39–41](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L39)
now fuses ECMA-402 §11.5.11 step 1 and 1.a through that same scanner. A defined
result includes zero and is the specified exact integer nanosecond offset; an
undefined result selects the named-zone branch. The former independent scanner
missed comma fractions and returned zero for them. A new Date-oracle cancellation
vector reproduced that error before correction. Public DateTimeFormat constructor
options retain their minute-only validation. This integration adds no reverse
dependency from ecma402-abstract to Temporal.

The shared result's magnitude is below 86,400,000,000,000, so Number represents
every nanosecond integer exactly. DateTimeFormat divides it by 1,000,000 for its
internal millisecond representation; original epoch nanoseconds still enter
Decimal before fractional offset addition/flooring. The expanded
[72-vector precision matrix](temporal-local-offset-precision-audit.md) covers
both decimal separators, both signs, mixed/maximal offsets, both timestamp limits
and −1/0/+1 ns around cancellation boundaries. This is separate from public
constructor syntax and from arbitrary timestamp-domain validation.

The offset's millisecond decimal has at most six fractional places and fourteen
significant digits. Division by 1,000,000 rounds once to binary64. At every
permitted offset magnitude, a binary64 rounding interval is at most 2**-26 ms
wide, smaller than the 10**-6 ms spacing between adjacent nanosecond offsets.
The original decimal is a round-trip candidate; any alternative with no more
significant digits at that magnitude has at least the same decimal spacing.
Therefore the shortest round-trip String recovers that original offset decimal.
[BigDecimal's noninteger Number constructor](../../packages/bigdecimal/index.ts#L225)
uses that String, while its integer branch converts exactly through BigInt.
[plus](../../packages/bigdecimal/index.ts#L317) coerces the offset through this
constructor. Thus offset encoding retains nanoseconds in the existing Decimal
addition path under ordinary intrinsic semantics. Epoch conversion and mutable
intrinsic access retain their separate review boundaries.

Existing Temporal grammar, minute-only and prototype-mutation controls exercise
the moved body through the unchanged wrappers. Eight focused gates pass using
the actual Instant target that owns those controls (one executed, seven cached).
Full 42-case pattern replay passes in isolation (322.3 seconds). The expanded
207-target run passes 205 tests (99 executed, 108 cached); two raw strict targets
exactly match existing ListFormat/PluralRules constructor-realm baseline keys and
messages. Baseline-aware gates pass. Ten package assemblies, all 40 Temporal
class/backend gates, unchanged 12,808-case ICU snapshot and native DateTimeFormat
comparison (9,440 cases / 40,284 assertions in source/bytecode runs) pass. The
extended-calendar Hermes gate passes 300 checks in both runs. Tested source hashes
remain unchanged. No baseline, exclusion or timeout changes.
No new specification inconsistency or historical Temporal source-line credit.
