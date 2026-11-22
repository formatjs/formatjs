# Calendar display-year normalization

Reviewed 2026-11-21 against published
[ECMA-402 §11.5.4](https://tc39.es/ecma402/#sec-formatdatetimepattern),
step 15.f.iv. The rule changes a nonpositive year to `1 - value` without a
calendar condition. This review covers that rendering step, not complete
calendar arithmetic, ToLocalTime or the formatter algorithm.

## Gap and correction

TS restricted this transformation to Gregorian and ISO calendars; their
internal providers supplied positive era years at that checkpoint. Rust rendered provider
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

Display normalization leaves non-Gregorian provider fields unchanged. They also
feed Temporal arithmetic; display normalization belongs to the pattern step. The [Gregorian record follow-up](temporal-local-time-record-audit.md)
now corrects Gregorian/ISO producer records to signed YearFromTime under
[§11.5.12 Table 17](https://tc39.es/ecma402/#sec-datetimeformat-tolocaltime-records).
Their display normalization happens in the pattern step. Non-Gregorian provider
fields stay unchanged; complete ToLocalTime and caller review remain open.

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

## Native Intl bridge follow-up

The separate native bridge still formatted raw provider era years, bypassing the
TS/Rust pattern producers above. The same published §11.5.4 step 15.f.iv therefore
required a correction in [restoreCalendarParts:361–384](../../packages/temporal/legacy-calendar-date.ts#L361).
It selects the existing era-year/date-year representation, converts a nonpositive
year to `1 - year`, then applies numeric or two-digit rendering. Calendar fields,
era labels, month/day and RelatedYear/YearName branches are unchanged. Built-in
years remain bounded integers, so this subtraction is exact in Number arithmetic.
This does not establish arbitrary custom-provider numeric domains.

[New packaged controls](../../packages/temporal/tests/legacy-display-year.test.mjs)
use ISO January 1 in −544/−543/−542, independently expecting Buddhist display years
2/1/1. They assert the raw Temporal year and eraYear remain −1/0/1. Before the fix,
the public namespace locale method returned `-1 BE` instead of `2 BE`.

The 124 controls cover English Latin and supplementary-plane mathematical digits,
numeric/two-digit widths, namespace PlainDate/PlainDateTime/PlainYearMonth and
ZonedDateTime locale methods, then installed DateTimeFormat with Number, Date,
Instant and three plain date types. Formatting, parts, equal ranges and range parts
run twice, exercising cold/warm projection and number caches. Distinct-year ranges
require the corrected start/end year and joined range text.

[Independent ICU era assertions](../../packages/temporal/tests/legacy-calendar-era-oracle.ts)
and [extended-calendar assertions](../../packages/temporal/tests/legacy-extended-calendar.test.mjs)
now apply the published display transformation to their raw fixture eraYear.
Fixture files remain unchanged. RelatedYear stays signed. These are normative
expected-output corrections, not accepted-failure baseline changes. Existing
boundary, clock, zone, era and range checks remain active.

Both single-value and range bridge paths call this shared restoration helper.
Namespace locale methods also use the same bridge parts/format functions.
Complete native bridge pattern selection, style inference, private collection
operations, bootstrap/realm behavior and calendar computations remain open.
The native ICU disagreement above remains separately recorded; no new spec issue
or historical Temporal source-line credit is claimed.

Validation: seven focused packaged/compiler/native-host/native-Hermes gates pass
(six executed, one cached). The packaged extended-calendar gate checks 60
independent ICU rows with 1,515 checks across all 14 non-Gregorian calendars.
Expanded matrix: 202/204 pass (79 executed, 125 cached), with only the exact existing
raw ListFormat/PluralRules constructor-realm diagnostics. Baseline-aware gates,
all ten package assemblies and all 40 Temporal class/backend gates pass. The
full 42-case pattern oracle and unchanged 12,808-case ICU snapshot pass from cache.
Native Hermes passes 936 independent ICU-era and 24 lunar checks in both source
and bytecode runs. The shared DateTimeFormat native comparison passes 9,440 cases
and 40,284 assertions per run. After the broad run, a redundant year condition was
removed from month/day oracle assertions; all five affected oracle/compiler gates
pass on rerun (four executed, one cached). Runtime, BUILD and other tested source
hashes remain unchanged. No baseline, exclusions, fixtures or timeout changes.

The follow-up [local-record audit](temporal-local-time-record-audit.md) also fixes
a missed native-Hermes extended-calendar display assertion. Parent #8109 CI
exposed its stale raw Buddhist year expectation; the reproduced failure now
passes with the same published normalization used by the other ICU oracles.
All 300 checks pass in source and bytecode, with raw fixture data unchanged.
The gate and its two owning runtime/compiler checks join the validation inventory.
