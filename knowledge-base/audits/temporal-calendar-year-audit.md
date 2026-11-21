# Calendar display-year normalization

Reviewed 2026-11-21 against published
[ECMA-402 §11.5.4](https://tc39.es/ecma402/#sec-formatdatetimepattern),
step 15.f.iv. The rule changes a nonpositive year to `1 - value` without a
calendar condition. This review covers that rendering step, not complete
calendar arithmetic, ToLocalTime or the formatter algorithm.

## Gap and correction

TS restricted this transformation to Gregorian and ISO calendars; their
internal providers already supply positive era years. Rust rendered provider
years directly. Buddhist provider years −1 and 0 therefore appeared as −1 and 0
instead of the algorithm's 2 and 1. The same issue can affect other providers
that return nonpositive year fields.

[TS:384](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L384)
now tests only the field name and sign. Positive values pass through unchanged;
nonpositive values become `1 - value` before either numeric or two-digit
formatting. The transformation also reaches range patterns through this shared
producer. RelatedYear and YearName use their separate branches.

[Rust:308](../../crates/intl_datetimeformat/render.rs#L308)
applies the same transformation before width selection. Checked subtraction
returns InvalidDate if a custom provider's result would exceed the existing
i32 rendering domain; it cannot overflow or panic. Complete custom-provider
numeric-domain support remains open. Built-in supported date ranges fit within
the existing integer domains; the transformation is exact there.

Calendar provider output remains unchanged. It represents the calendar fields
used by Temporal arithmetic as well as locale formatting; display normalization
belongs to the pattern step. Gregorian providers' existing positive-era-year
encoding remains an internal representation difference from
[§11.5.12 Table 17](https://tc39.es/ecma402/#sec-datetimeformat-tolocaltime-records),
whose Gregorian Year row is signed YearFromTime. Full ToLocalTime record review
remains open; the existing Gregorian composition still produces the specified
display year.

## Evidence and native disagreement

[TS public regressions](../../packages/intl-datetimeformat/tests/calendar-loading.test.ts)
load the real Buddhist provider and English calendar patterns. ISO dates
−000544-01-01, −000543-01-01 and −000542-01-01 independently select Buddhist
years −1, 0 and 1. Assertions check the resolved calendar to prevent silent
Gregorian fallback, then require numeric year parts 2/1/1 and two-digit parts
02/01/01. Before the fix, the negative and zero cases failed.

[Rust public regressions](../../crates/intl_datetimeformat_calendars/ffi.test.rs)
load the real provider and optional locale package through Runtime. They check
the same six year/width combinations through format_to_parts. The new test
failed before the Rust correction. Neither implementation replaces calendar
arithmetic or rendering with a mock.

[Owned Temporal integration](../../packages/intl-datetimeformat/tests/temporal-owned.test.ts#L87)
also checks the same three ISO years through PlainDate inputs and public
PlainDate.toLocaleString, with explicit English year/era output.

Native Intl/ICU instead emits Buddhist −1/0/1 for those dates. This is recorded
as a [conformance discrepancy](temporal-conformance-discrepancies.md#native-buddhist-year-numbering-versus-published-display-normalization),
not a proven specification contradiction. Follow the published algorithm;
native agreement does not override its unconditional step. No upstream issue
was filed and no specification defect is claimed from this witness alone.

NumberFormat construction, locale data, complete calendar providers and the
remaining FormatDateTimePattern steps retain their existing audit status.
Historical Temporal source-line counts gain no credit from this dependency fix.

## Validation

Four focused gates pass (three executed, one cached): TS units and compiler,
Rust formatter units and the Rust calendar-provider integration target. These
cover 396 passing TS cases with three existing skips, 29 formatter cases and
three calendar cases. Both new negative/zero TS cases and the Rust witness
failed before the fixes. Gazelle ran after fixture/import changes.

The full 42-case TS/Rust pattern oracle passes in isolation (324.7 seconds).
The expanded affected-consumer invocation passes 170/171 test targets (65 executed,
106 cached) and builds all eight Temporal/Intl package assemblies. The sole
failure is the existing raw ListFormat strict diagnostic: all 162 scenarios were
examined; its two constructor-realm failure keys and messages match the checked-in
baseline exactly. The baseline-aware gate passes. No test exclusions,
accepted-failure baselines or timeout limits changed.

All 40 Temporal class/backend Test262 gates pass. The owned Temporal integration
passes 22 cases, including the three new locale controls. The 12,808-case ICU4J
snapshot gate passes unchanged (44.4 seconds). Its existing classification rules
do not turn the new year-zero native disagreement into parity; that boundary is
covered by the explicit spec-derived tests above.
