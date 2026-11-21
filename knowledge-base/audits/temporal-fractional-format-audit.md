# Temporal fractional-second formatting audit

Pinned specification: `b038883fe9c6aa871ccab3238c90daf9eb5e9b17`.
Scope: [FormatFractionalSeconds, abstractops 762–770](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L762-L770).
Nine new numbered traces. Public callers and surrounding formatting algorithms
remain separate work.

## Fix and trace

[format-digits.ts](../../packages/temporal/format-digits.ts) implements the bounded
operation for integer fractions 0 through 999999999 and precision auto or 0–9.
Its callers supply those validated values; this internal helper does not coerce
or validate public options.

- 762–763: auto with zero returns the empty string.
- 764: zeroPadDecimal uses the captured ToString conversion on a primitive
  bounded integer, then prepends zero code units to exactly nine digits.
  This domain never needs sign or exponent notation.
- 765: indexed comparisons trim trailing U+0030 only. A nonzero fraction has
  a nonzero digit, so the loop stops before accessing an absent index.
- 766–768: explicit zero returns empty; other fixed precisions use the same
  nine-digit representation.
- 769–770: indexed concatenation selects the requested prefix and prepends
  U+002E. Every index lies within the primitive string's own digit positions.

Instant, PlainTime and Duration previously read mutable String, padStart, slice
or replace while building private digits. Their three formatting implementations
now share this operation. Instant also uses zeroPadDecimal for its calendar,
clock and offset components. PlainTime's two-digit conversion and Duration's
whole-second BigInt conversion use captured ToString. Public option getters
and user conversions keep their existing behavior.

No String.prototype methods, iterators or regular expressions participate in
this shared helper. ToString already captures this realm's original constructor;
primitive numbers/BigInts do not invoke user conversion hooks. Padding and prefix
selection cannot call inherited string getters because they use valid own indices.

The integer fraction is exact at each callsite: Instant combines bounded ISO
millisecond/microsecond/nanosecond fields; PlainTime takes its within-day integer
nanoseconds modulo 1e9; Duration converts only a nonnegative BigInt remainder
below 1e9 to Number. Caller rounding happens before formatting.

Rust already avoids JS hooks. IsoString::append_time in
[format.rs](../../crates/temporal/format.rs) removes trailing decimal zeros by
integer division in auto mode, or divides by 10^(9-precision) and writes exactly
precision digits. Zero digits suppress the decimal point. write_duration in
[duration.rs](../../crates/temporal/duration.rs) applies the same equivalent
arithmetic before writing the second fraction. Comments link both paths to the
pinned steps; Rust behavior is unchanged.

## Evidence and limits

Twelve public mutation cases separately replace String, padStart, slice and
replace across Instant, PlainTime and Duration. Eleven failed before the fix
with `Private formatting hook reached`; Instant/replace was already a passing
control. Each case checks auto and explicit precision after restoring the hook.

Six fraction vectors cover zero, leading zeros, trailing zeros, mixed interior
zeros and maximum fractional value. All eleven precisions match an independent
JS Temporal implementation: 198 serializations. Native Hermes repeats the twelve
mutation cases and 198 precision outputs through installed native methods.
Existing ICU string and rounding controls provide separate data-driven coverage.

Parsing still uses public string/regexp methods. Date-time/zoned callers retain
separate string operations outside this helper. Date-only output, timezone
identifiers, calendar codes, installation-time captures and full realm semantics
remain open. This pass does not claim complete toString/toJSON compliance.
No new spec inconsistency was established.

The 72-target Temporal matrix passes, including all 40 class/backend Test262
gates, Rust tests, native Hermes and existing Intl profile gates. In that run,
59 targets executed and 13 reused valid cached results. Existing four raw Intl
data differences remain separately recorded; passing profile gates do not mean
zero raw Intl failures. No exclusions, baselines or timeouts changed.

Three additional ICU string-oracle/typecheck targets pass on Node and native
Hermes, bringing validation to 75 distinct test targets. Temporal package assembly
also passes. Gazelle ran after adding the new internal source file and imports;
AST lint, formatter checks and the 14-file ledger integrity check pass.
