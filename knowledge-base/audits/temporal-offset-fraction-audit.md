# UTC-offset fraction padding audit

Source: published [ECMA-262 §21.4.1.33.2 ParseTimeZoneOffsetString](https://tc39.es/ecma262/#sec-parsetimezoneoffsetstring), checked 2026-11-21.
This is an ECMA-262 dependency used by Temporal. It does not establish a
Temporal API chapter in that document or complete the surrounding parsers.

## Reviewed substeps

The fraction branch contributes zero when absent (15.a). Otherwise, 16.b–16.c
append zeros and select nine digits after the decimal separator; 16.d converts
that bounded decimal integer. Existing grammar restricts supplied digits to at
most nine ASCII digits. Padding just the captured digits to width nine therefore
produces the same integer, including leading zeros and absent fractions.

[instant-string.ts](../../packages/temporal/instant-string.ts) now uses the private
fractionDigits helper at all four fraction-padding sites: offset, Instant,
date-time and PlainTime parsing. A loop appends zero characters directly, without
reading String.prototype.padEnd. Offset parsing converts the result through the
already captured BigInt constructor, preserving the specified integer exactly.
The absent case becomes nine zero digits and then zero. No public coercion or
option order changes.

Rust Input::time in [parse.rs](../../crates/temporal/parse.rs) already accumulates
at most nine ASCII fraction digits, then multiplies by 10^(9-digitCount).
Its absent fraction starts at zero. This is the equivalent bounded integer value;
native controls exercise that unchanged path without JS prototype methods.

The three other parsers reuse the same bounded digit-padding operation. Their
complete grammars, mutable RegExp/string operations and caller sequencing remain
open. A separate padEnd call in duration-core.ts's duration fraction parser also
remains open; this change covers the four instant-string.ts sites. No complete ECMA-262 or Temporal section is signed off by this change.
These four ECMA-262 substep mappings are separate from historical Temporal
source-line counts.

## Evidence

Five public regressions failed before the fix with
`Private fraction padding hook reached`: a fixed-offset ZonedDateTime constructor,
Instant offset parsing, PlainTime fraction parsing, PlainDateTime fraction parsing
and zoned fraction parsing. All restore the replaced getter before assertions.
Installed native Hermes repeats those public mutation controls.

Eleven input vectors cover absent fractions, widths one through nine and a
leading-zero nanosecond. Both offset signs and both decimal separators compare
42 parsed Instants with an independent JS implementation. Existing ICU string,
clock, ISO and Test262 controls retain their separate validation scope.

No spec inconsistency was found in these padding substeps. The separately recorded
MakeDay witness ambiguity was rechecked against published ECMA-262 §21.4.1.28
step 8 and §21.4.1.1; the finite-time-value witness requirement is still present.

## Validation

75 distinct Bazel test targets pass, including all 40 class/backend Test262
gates, Node/native ICU string oracles, Rust and native Hermes. 58 targets execute;
17 reuse valid cached results. Node's Instant/Duration/rounding target passes all
198 cases. Temporal package assembly, AST lint and ledger integrity pass.
Existing four raw Intl data differences remain recorded separately; profile-gate
success does not mean zero raw failures. No exclusions, baselines or timeouts change.
