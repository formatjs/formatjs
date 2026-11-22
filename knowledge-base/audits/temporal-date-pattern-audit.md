# Date pattern producer audit

Reviewed 2026-11-21 against published
[ECMA-402 §11.5.4 FormatDateTimePattern](https://tc39.es/ecma402/#sec-formatdatetimepattern).
This operation feeds Temporal's owned locale bridge, ordinary dates and ranges.
The mapping below distinguishes reviewed result/numeric steps from open constructor,
calendar and locale-data work. It is not complete operation signoff.

The [private-cache follow-up](temporal-private-format-cache-audit.md) protects
WeakMap operations in this producer, numeric partition dispatch and directly
used constructor/number dependencies. Its numeric partition mapping retains
those broader operation dependencies as open.

## Fixed gaps

The central TS loop used a mutable array iterator and push, allowing inherited
numeric setters to intercept its private List entries. Every branch now appends
through captured own-property creation, using indexed private-array traversal.
The fractional-second branch uses captured floor. Two-digit truncation scans the
last two Unicode code points without Array.from, slice, join or String iteration.

Both TS and Rust previously discarded unrecognized field names. Step 15.j
requires a part with type unknown. Both now preserve its position and emit the
same deterministic ILND fallback: `fieldName:epochNanoseconds`. This is an
implementation choice for the fallback text, not a standardized output spelling.
The epoch stays exact; no intermediate Number conversion occurs. Existing valid
locale field schemas remain the caller's responsibility.

## Published steps to source

The TS helper accepts already partitioned private records; its caller owns step
13's PartitionPattern invocation. Links below refer to
[FormatDateTimePattern.ts](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts).

| Published step                             | Source                                                                                           | Status and evidence                                                                                                                                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1: locale                                  | [172](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L173)              | Read from private slots when creating the number formatters. Constructor/cache contract remains open.                                                                                                                                          |
| 2–4: nf options                            | [181](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L182)              | Existing null-prototype options, numberingSystem and useGrouping writes mapped. Mutable Object.create remains open.                                                                                                                            |
| 5: construct nf                            | [185](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L186)              | Delegates to createMemoizedNumberFormat. Intrinsic construction and cache observability remain open.                                                                                                                                           |
| 6–10: nf2 options/construction             | [186](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L187)              | minimumIntegerDigits = 2 plus numberingSystem/useGrouping. Same open constructor boundary.                                                                                                                                                     |
| 11.a–f: fractional formatter               | [191](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L192)              | Existing conditional nf3 path mapped. Selected format versus slot field resolution remains open.                                                                                                                                               |
| 12: local time                             | [247](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L248)              | Calls ToLocalTime or reuses the endpoint already computed by the range path. Full conversion, calendar and timezone contracts remain open.                                                                                                     |
| 13: partition pattern                      | [caller line 41](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimePattern.ts#L43) | Caller supplies the parsed private List; parser has its own [seven-step proof](temporal-pattern-partition-audit.md). Cache behavior remains open.                                                                                              |
| 14: empty result List                      | [258](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L259)              | Reviewed fresh private array allocation.                                                                                                                                                                                                       |
| 15 / 15.a: ordered record traversal/type   | [291](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L292)              | Reviewed indexed iteration over the dense private List; no iterator lookup.                                                                                                                                                                    |
| 15.b.i: literal append                     | [294](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L295)              | Reviewed own type/value Record and own List index; literal text unchanged.                                                                                                                                                                     |
| 15.c.i–v: fractional seconds               | [299](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L300)              | Arithmetic and append reviewed for digits 1–3 and millisecond 0–999. Division by 100/10/1 has the same floor as the specified decimal scaling within these bounds. NumberFormat and field-presence preconditions retain their separate status. |
| 15.d.i–iv: flexible day period             | [307](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L308)              | Append reviewed. LDML rule selection, inherited data reads and mutable rules.find remain open.                                                                                                                                                 |
| 15.e.i–v: timezone name                    | [317](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L318)              | Append reviewed; epoch-zero comparison now uses captured BigInt conversion. Localized selection and GMT rendering remain open.                                                                                                                 |
| 15.f.i–iii: field/format/value lookup      | [374](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L375)              | Existing table dispatch mapped. Format precedence and calendar field encoding remain open.                                                                                                                                                     |
| 15.f.iv–vii: year/month/hour transforms    | [384](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L385)              | Year normalization reviewed in the [year follow-up](temporal-calendar-year-audit.md). Provider encoding and monthNumber adaptation remain open calendar work; hour-cycle branches retain their separate status.                                |
| 15.f.viii–ix: numeric/two-digit formatting | [403](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L409)              | Numeric formatter calls mapped, intrinsic boundary open. Last-two-code-point projection reviewed at [115](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L116); Latin and supplementary Adlam controls pass.          |
| 15.f.x–xi: localized field / append        | [412](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L420)              | Append reviewed. Stand-alone context, missing-data fallback and leap-month String replacement remain open locale work.                                                                                                                         |
| 15.g.i–iii: AM/PM                          | [445](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L453)              | Hour split mapped and own append reviewed. Locale labels/data contracts remain open.                                                                                                                                                           |
| 15.h.i–iii: related year                   | [457](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L465)              | Own append reviewed. RelatedYear presence and numeric formatting remain open dependencies.                                                                                                                                                     |
| 15.i.i–iii: year name                      | [466](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L474)              | Own append reviewed. Calendar name index/data completeness remain open.                                                                                                                                                                        |
| 15.j.i–ii: unknown field                   | [475](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L483)              | Reviewed fallback depends on both original field name and exact epoch. Always appends an unknown part.                                                                                                                                         |
| 16: return                                 | [483](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L491)              | Reviewed ordered List return.                                                                                                                                                                                                                  |

## Representation and Unicode proof

All central-loop branches create ordinary Record objects with own type/value
properties, then define an own numeric List entry through
[setDataProperty](../../packages/ecma262-abstract/intrinsics.ts#L62).
Its captured intrinsic and null-prototype descriptor are covered by the
[shared result audit](temporal-parts-result-audit.md#data-property-creation).
This protects each central append; it does not protect unrelated cache or locale
helper work before a branch produces its value.

lastTwoCodePoints walks backward at most two code points. A trailing surrogate
joins its immediately preceding leading surrogate; unmatched units each remain
one code point. A final indexed concatenation preserves those code units exactly.
Inputs of at most two UTF-16 code units need no truncation. Longer inputs with
only two supplementary code points remain whole. No public String iterator or
array/string method participates in this projection.

Rust's [PartKind](../../crates/intl_datetimeformat/render.rs#L18) adds Unknown.
The [fallback branch](../../crates/intl_datetimeformat/render.rs#L340) appends
before continuing the loop, preserving literals and subsequent known fields.
LocalTime retains original epoch_nanoseconds, so fallback text matches TS exactly.
Rust private Vec traversal needs no JavaScript intrinsic protection.

## Evidence and remaining work

[TS producer controls](../../packages/intl-datetimeformat/tests/pattern-records.test.ts)
use a real initialized DateTimeFormat, loaded English data, real ToLocalTime and
real native NumberFormats. Mutation controls reuse already computed endpoint
records/formatters through the existing range optimization seam. They exercise
the actual producer, not a mock or replacement projection. Nine controls failed
before the fix: unknown fields plus iterator, push, numeric setter, floor,
Array.from, slice, join and String iterator. All 11 cases now pass, including
Latin/Adlam two-digit controls. The full unit target passes 393 tests with three
existing skips.

The [Rust witness](../../crates/intl_datetimeformat/pattern.test.rs) failed before
the mirrored fix and now passes with all 29 crate tests. Five focused targets
pass, including owned Temporal integration and TS compilers.

The expanded 167-target invocation finished with 165 passing targets, the existing
raw ListFormat strict diagnostic failure, and a 300-second timeout in one CLDR
case of rust_datetime_pattern_test (64 executed, 103 cached). All eight package
assemblies built. The ICU conformance snapshot gate passed unchanged.

The entire 42-case TS/Rust pattern oracle then passed in isolation with
`--jobs=4 --local_test_jobs=1`; the previously timed-out case took 189 seconds.
Source hashes, test corpus and the existing 300-second limit stayed unchanged.
Thus all 166 regression targets passed across the two invocations. The remaining
strict diagnostic exactly matches the two existing ListFormat constructor realm
failures documented in the [parser audit](temporal-pattern-partition-audit.md).
No baseline or exclusion changed.

No new specification defect identified. Remaining work includes constructor
intrinsics/cache behavior, ToLocalTime and calendar fields, locale-data property
contracts, flexible-period find, GMT String/RegExp operations, leap-month
replacement and complete public-method paths. Temporal chapter selection and
historical source-line credits remain unchanged.
