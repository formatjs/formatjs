# PlainDateTime addition contract

Reviewed 2026-11-22. Scope: PlainDateTime.add/subtract receiver checks, duration preparation, sign handling, overflow, clock carry, calendar addition and result construction across TS/Rust/native paths.

Numbered comparison uses separately published official Temporal proposal:[§5.3.28 add](https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.add),[§5.3.29 subtract](https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.subtract),[§5.5.16 AddDurationToDateTime](https://tc39.es/proposal-temporal/#sec-temporal-adddurationtodatetime). Requested current ECMA-262 Temporal API authority remains unresolved. This mapping does not certify those dependencies or complete API compliance.

## Receiver and result

[Public wrappers](../../packages/temporal/plain-date-time.ts#L431) call[read](../../packages/temporal/plain-date-time.ts#L140) before duration or options access. Missing private DateTime brand throws intrinsic TypeError. The[factory](../../packages/temporal/plain-date-time.ts#L151) validates local range, allocates a fresh intrinsic-prototype object and preserves calendar. NativeData can consume a validated native slot through its alternate factory branch; full realm/native-slot trust remains a dependency.

## AddDurationToDateTime

| Comparison step                | Source mapping and remaining contract                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1: duration conversion         | [TS helper](../../packages/temporal/plain-date-time.ts#L241) calls[toDurationFields](../../packages/temporal/duration.ts#L87), copying a private Duration, parsing a string or preparing a field bag. NativeData uses[toNativeDurationFields](../../packages/temporal/duration.ts#L94), validating before options. Complete conversion/parser/coercion contracts remain delegated.                                                |
| 2: subtraction negation        | [Indexed canonical fields](../../packages/temporal/plain-date-time.ts#L257) multiply private Number fields by operation sign. No Object.keys or array-iterator lookup. Rust[checked_subtract](../../crates/temporal/date.rs#L388) uses[Duration.negated](../../crates/temporal/duration.rs#L124). Native negation follows prepared overflow internally; validated integer negation cannot coerce, fail or mutate public operands. |
| 3: options normalization       | [overflowOption](../../packages/temporal/date-core.ts#L118) calls[optionsObject](../../packages/temporal/rounding.ts#L68): undefined becomes a private record; other non-Objects reject. Duration conversion finishes first.                                                                                                                                                                                                      |
| 4: overflow option             | [overflowOption](../../packages/temporal/date-core.ts#L119) reads overflow once, stringifies if present, defaults constrain and permits constrain/reject. Abrupt conversion or option failure stops later calendar arithmetic.                                                                                                                                                                                                    |
| 5: internal 24-hour-day record | [TS clock/day preparation](../../packages/temporal/plain-date-time.ts#L260) retains Duration days separately until adding clock carry. Algebraically equivalent to including those days in 24-hour time first. Complete Duration normalization remains a dependency.                                                                                                                                                              |
| 6: clock addition              | [TS](../../packages/temporal/plain-date-time.ts#L261) adds exact BigInt clock quantity to receiver clock. [Rust](../../crates/temporal/date.rs#L377) uses i128.                                                                                                                                                                                                                                                                   |
| 7: adjust day duration         | [TS](../../packages/temporal/plain-date-time.ts#L262) computes floor-day carry through[epochDayOf](../../packages/temporal/date-core.ts#L241), then adds it to days. [Rust](../../crates/temporal/date.rs#L381) combines weeks*7, days and div_euclid carry. Years/months remain separate.                                                                                                                                        |
| 8: calendar addition           | [TS addDate](../../packages/temporal/date-core.ts#L572) delegates calendar addition with selected overflow and date-range check. Rust[add_date](../../crates/temporal/date.rs#L178) performs checked narrowing/provider addition. Calendar-specific constrain/reject algorithms remain open dependencies.                                                                                                                         |
| 9: combine date and clock      | [TS composition](../../packages/temporal/plain-date-time.ts#L266) uses epochDay*day plus[timeOf](../../packages/temporal/date-core.ts#L246), a nonnegative remainder. Rust[date.to_date_time](../../crates/temporal/date.rs#L199) composes the same integers.                                                                                                                                                                     |
| 10: result creation            | [TS factory](../../packages/temporal/plain-date-time.ts#L151) and[Rust constructor](../../crates/temporal/date.rs#L323) enforce local representability and retain calendar. Rust's[strict local interval](../../crates/temporal/iso.rs#L93) matches the source boundary contract; complete factories/realms remain separate.                                                                                                      |

## Arithmetic bounds

Valid Duration day/clock magnitude is below 2**53 seconds. Whole days and clock carry are each below about 1.043e11; their sum is below 2.086e11, safely below 2**53. Source multiplies/composes nanoseconds in BigInt. Clock remainder remains in [0, day). Rust uses i128 with checked narrowing into calendar provider fields. Existing calendar component bounds and provider arithmetic remain dependencies.

Negative fractional-day totals use floor plus nonnegative remainder, preserving correct previous-day carry. No additional precision or range defect was established in this bounded operation review.

## Native route

[TS native dispatch](../../packages/temporal/plain-date-time.ts#L245) precedes source sign handling. The[adapter](../../packages/temporal/native.ts#L904) chooses optional direct native capability or generic native call, then normalizes its result. [FFI](../../crates/temporal/ffi.rs#L1496) reconstructs Duration and calls[Rust checked_add/subtract](../../crates/temporal/date.rs#L375). Both routes receive overflow after public preparation. Captured transport keys avoid the source enumeration defect; serialization/direct-capability ownership and calendar-result validation remain separate contracts.

## Regression evidence

Replacing Object.keys or Array.prototype[Symbol.iterator] made source arithmetic expose private field enumeration before reading overflow. Indexed canonical field traversal removes those lookups while retaining existing arithmetic order.

[Shared public controls](../../packages/temporal/tests/plain-arithmetic-oracle.ts#L10) cover six add/subtract cases across PlainDate, PlainDateTime and PlainYearMonth under each hook replacement. The PlainDateTime pair uses 2020-01-31T23:30 with 1 month 1 hour: add yields 2020-03-01T00:30, subtract yields 2019-12-31T22:30. Controls restore hooks before formatting/assertions and require exactly one overflow Get. The TS owning gate reproduced the defect; native controls passed before correction. All nine focused gates pass.

## Open dependencies

This maps every caller stage without treating green oracles as complete compliance. Remaining obligations: full ToTemporalDuration variants/coercion/abrupt completion; calendar providers and bounds; complete range/factory/realm behavior; native transport and slot ownership; intrinsics outside selected enumeration; authoritative requested Temporal specification mapping.

## Final validation

All 31 expanded tests pass (20 executed, 11 cached), including all 15 affected
class/backend gates and six Rust consumer suites. Temporal package assembly
passes. [Exact target matrix](temporal-plain-add-validation-targets.txt).
No baseline, fixture count or exclusion changes. These checks support the
corrected paths; delegated contracts above remain open.
