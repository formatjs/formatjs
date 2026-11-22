# Zoned offset matching

Reviewed 2026-11-21: the exact/minute comparison core used by
ZonedDateTime conversion. No arithmetic defect was found in this bounded slice.
This is conditional source evidence, not complete conversion or public-method
signoff. No runtime correction was needed; independent controls validate the
bounded contracts below.

The inherited ledger leaves `InterpretISODateTimeOffset` lines 910–935 open.
The [historical entry](temporal-spec-audit.md#zoneddatetime) remains navigation
evidence only. This document adds no numbered ECMA-262 Temporal section credit;
the requested live document has no Temporal API chapters in the fetched snapshot.

## Comparison and rounding

[TS offset candidates:318](../../packages/temporal/zoned-date-time.ts#L318) walks candidate
instants and computes `actual = localTime - candidate`. Lines 323–324 accept
exact equality, or equality after minute rounding when `matchMinute` is true.
This assumes the zone supplies valid, complete candidates for the same local
date/time.

Lines 319–322 compute, for offset `a` and minute `M = 60_000_000_000` ns:

```text
sign(a) * floor((abs(a) + M / 2) / M) * M
```

For nonnegative magnitude, adding half an increment before integer division
selects the nearest integer minute, with ties increasing the magnitude. Restoring
the sign gives half-expand for either sign. TS chooses positive sign at zero;
the zero product remains zero. All arithmetic uses BigInt, including subtraction,
absolute magnitude, addition, division and multiplication. No Number conversion
can lose nanoseconds in this core.

[Rust zoned_string:119](../../crates/temporal/zoned_string.rs#L119) instead visits
candidate offsets. Lines 121–129 reject offsets outside exclusive ±day, construct
an in-range candidate from `local - actual`, and check that the zone's offset at
that candidate equals `actual`. Thus the validated candidate has the same
`local - candidate` offset used by TS. Candidate completeness depends on the
[TimeZone visitor contract](../../crates/temporal/zoned.rs#L43).

Line 130 calls [format::offset_minutes:156](../../crates/temporal/format.rs#L156)
and multiplies by the minute scale. This is the same integer expression. Rust's
`signum()` is zero at zero, with the same result. The prior exclusive ±day guard
makes `abs()`, addition and minute multiplication safe in i128. The
[local bound](../../crates/temporal/iso.rs#L93) is the epoch limit plus one day;
subtracting a bounded offset is also far inside i128. This does not prove the
entire local-field conversion or provider implementation.

## Matching order and syntax

TS returns the first matching candidate. Its
[fallback producer:285](../../packages/temporal/kernel.ts#L285) checks candidate
epoch bounds and local round trips, then sorts the list ascending at line 293.
Under that sorted-candidate contract, first match is earliest. Native and host
candidate producers retain separate completeness/order obligations.

[Rust:131](../../crates/temporal/zoned_string.rs#L131) keeps a match only if no
previous match exists or its instant is earlier. Its result is therefore earliest
regardless of visitor order. Exact matching also takes precedence naturally when
the same candidate satisfies both comparisons; a later exact match does not
override an earlier rounded match. This review does not establish that every
zone visitor supplies every possible candidate.

[TS:412](../../packages/temporal/zoned-date-time.ts#L412) enables minute matching
for string offsets with hours and optional minutes, without seconds.
[Rust parse:293](../../crates/temporal/parse.rs#L293) distinguishes UTC, wall,
minute and exact input; consumed lengths 3/5/6 select minute precision. Those
lengths correspond to valid hour/basic-minute/extended-minute syntax only under
the preceding parser's grammar contract. Field-bag offset conversion uses exact
matching. Complete parsing, mutable regular-expression dependencies and option
read order are outside this arithmetic proof.

## Evidence and missing controls

[TS historical controls:190](../../packages/temporal/tests/zoned.test.ts#L190)
and [Rust controls:539](../../crates/temporal/zoned_string.test.rs#L539) use Paris's
`+00:09:21` offset. Minute syntax accepts its rounded `+00:09`; explicit seconds
and field bags require exact matching. This exercises positive rounding below a
half-minute. It does not establish tie behavior or all provider contracts.

Independent controls now cover:

- [Rust signed boundaries:576](../../crates/temporal/zoned_string.test.rs#L576):
  actual offsets ±29,999,999,999, ±30,000,000,000 and ±30,000,000,001 ns,
  zero and ±1 ns. Exact/minute hints preserve independent literal instants;
  incorrect exact hints reject.
- [Rust fold selection:623](../../crates/temporal/zoned_string.test.rs#L623):
  a real TransitionZone falls from +20 seconds to zero at epoch zero. Local
  00:00:10 has candidates -10 and +10 seconds, both rounding to offset zero.
  Minute matching picks -10; exact zero picks +10, even under later/reject
  disambiguation. Reversing visitor order preserves the earliest match.
- [Rust day bounds:693](../../crates/temporal/zoned_string.test.rs#L693):
  exact offsets one nanosecond inside ±day remain valid. Minute rounding can
  reach ±day; invalid hints at those exclusive bounds reject.
- [Shared public controls](../../packages/temporal/tests/zoned-arithmetic-oracle.ts#L110):
  Monrovia's 1970 offset was -00:44:30, verified against
  [IANA 2026f africa](https://data.iana.org/time-zones/tzdb-2026f/africa) and the
  repository's pinned data. Local midnight with minute hint -00:45 accepts
  epoch 2,670,000,000,000 ns; exact -00:44:30 accepts the same instant, while
  exact -00:45:00 rejects. These controls run in TS and native Hermes source
  and bytecode without changing ICU fixture counts or golden values.

Focused Duration/offset validation passes three gates (two executed, one cached).
Shared public/native validation also passes three gates (two executed, one
cached), for six passing gates overall. No baselines, exclusions or
timeouts changed.

Full callers, start-of-day handling, offset use/ignore/prefer/reject branches,
fallback disambiguation, candidate producers, calendar/range preparation and
realm behavior stay open. The known lower-local-date guard is tracked separately
in [spec issues](temporal-spec-issues.md#range-guard-removal-note-versus-lower-bound-offset-behavior).
