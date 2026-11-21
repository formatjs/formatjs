# Explicit timezone transition lookup

Reviewed 2026-11-21 for [ECMA-402 §11.5.11 step 2.b](https://tc39.es/ecma402/#sec-tolocaltime).
Scope is the named-zone dependency used when formatting Temporal values. This
proves explicit-transition selection under the data contracts below. It does
not sign off named-zone availability, future-rule arithmetic, complete
ToLocalTime, public callers or realm/intrinsic behavior. No runtime change or
new test execution belongs to this review.

## Data contract

[RFC 9636 §3.2](https://www.rfc-editor.org/rfc/rfc9636.html#section-3.2)
requires strictly ascending integer-second transition timestamps. Type 0 applies
before the first transition. Each transition selects the type beginning at that
instant. [§3.3](https://www.rfc-editor.org/rfc/rfc9636.html#section-3.3) requires a
nonempty footer to agree with the final explicit transition at its timestamp.
These are TZif input requirements, not additional ECMA-402 steps.

- [generator.py:23](../../packages/intl-datetimeformat/tzdata/generator.py#L23)
  reads pinned zic output through CPython's TZif parser. Lines 26–34 start with a
  type-0 sentinel, replace its value for transitions before the retained range,
  preserve the order of retained transitions and always emit a nonempty list.
  Lines 35–47 retain the parsed footer. Sorted source data and footer continuity
  are trusted zic/TZif contracts; this generator does not independently validate
  either.
- [process-zdump.ts:417](../../packages/intl-datetimeformat/scripts/process-zdump.ts#L417)
  preserves generated row order, representing the sentinel timestamp as an empty
  string. [packer.ts:10](../../packages/intl-datetimeformat/scripts/packer.ts#L10)
  encodes rows in that order. Its zone-name sort does not reorder transitions.
  Separately added fixed Etc/GMT zones receive a sentinel through
  [processZone:344](../../packages/intl-datetimeformat/scripts/process-zdump.ts#L344).
- [UnpackTimeZoneData:19](../../packages/ecma402-abstract/DateTimeFormat/UnpackTimeZoneData.ts#L19)
  restores an empty timestamp as `-Infinity`; finite timestamps and offsets are
  decoded as base-36 seconds. This path assumes a valid pack and ordinary
  intrinsics. It does not enforce nonempty rows, ordering or footer continuity.
- [Rust decode:168](../../crates/intl_datetimeformat/timezone.rs#L168) restores
  the sentinel as `i64::MIN`. Lines 177–201 reject invalid indices/DST, duplicate
  or decreasing timestamps, empty rows and missing sentinel. Lines 204–206 check
  footer field validity, but do not check agreement with the last explicit type.
  Supported Date/Temporal timestamps are later than the Rust sentinel.

Thus shipped valid TZif-derived packs supply the required sorted, nonempty
sentinel list. Unchecked custom packs are a separate contract. Rust accepts
structurally valid but discontinuous footers; TS accepts additional malformed
structures. Neither behavior establishes compliance for arbitrary custom data.

## Explicit selection

Let `q` be the instant in seconds and `a` the transition list.
[TS TimeZoneOffset:75](../../packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.ts#L75)
starts `low = 0`, `high = a.length`. The sentinel gives `a[low].time <= q`;
every index at or above `high` has a timestamp greater than `q`, vacuously at
initialization. Each midpoint comparison preserves both facts and reduces the
gap. At termination, `low` is the greatest index whose timestamp is at most `q`.

[Rust offset_at:312](../../crates/intl_datetimeformat/timezone.rs#L312) uses
`partition_point(timestamp <= seconds)`. The predicate is a true prefix because
timestamps increase. The sentinel guarantees at least one true element within
the supported domain; the preceding element is the same greatest index.

Consequently, both select the sentinel before the first finite transition, the
new row exactly at a transition, and the final row after the last transition when
no footer applies. A sentinel-only list selects its sole row.

For integer transition second `S` and integer nanosecond instant `N`,
`floor(N / 10**9) >= S` exactly when `N >= S * 10**9`. Rust uses that Euclidean
quotient directly. TS receives floored integer milliseconds from
[ToLocalTime:94](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L94).
The [bounded comparison proof](temporal-local-time-record-audit.md#named-transition-precision-boundary)
shows its division by 1000 cannot cross an integer-second boundary in the
supported range. Returned offsets remain seconds; the caller converts to
milliseconds separately.

## Final-transition fractional second

[TS:72](../../packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.ts#L72)
enters footer evaluation when `milliseconds / 1000 > last.time`.
[Rust:298](../../crates/intl_datetimeformat/timezone.rs#L298) first floors to
seconds, then uses `seconds > last.time`. During the fractional second after the
last transition, the branches can differ.

For valid TZif-derived data, §3.3 footer continuity makes their results equal:
the footer agrees with the last explicit type at that transition, and its
integer-second rules cannot change type before the next integer second. This
argument assumes the footer evaluator computes those rules correctly; it does
not prove the complete evaluator. A custom inconsistent footer can expose the
branch difference, so it must not be called a confirmed defect for valid IANA
data.

## Evidence and remaining checks

[Rust boundary controls](../../crates/intl_datetimeformat/timezone.test.rs#L44)
cover instants immediately before and exactly at explicit transitions, historical
seconds and negative nanoseconds. [Decoder controls](../../crates/intl_datetimeformat/timezone.test.rs#L77)
cover bad indices, decreasing timestamps, missing sentinel and atomic rejection.
The [all-zone comparison](../../packages/intl-datetimeformat/tests/rust-timezones.test.ts#L95)
samples each finite transition at `−1/0/+1 ns`. Existing successful runs are
recorded in the [local-record audit](temporal-local-time-record-audit.md#evidence).
They are regression evidence, not a replacement for the conditions above.

At an integer-second transition, `+1 ns` still floors to the transition's exact
millisecond in TS. That sample does not exercise the differing footer branch.
Additional checks should validate shipped pack ordering/sentinels and footer
continuity, then compare the final transition at `−1 ns`, exact, `+1 ms`,
`+999 ms` and `+1 s`, including negative timestamps and sentinel-only packs.
Future-rule evaluation, generated-data trust, missing-data policy and complete
caller contracts retain their separate open status.
