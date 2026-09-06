# ECMA-402 2027 polyfill audit

Audit date: 2026-09-06

FormatJS revision: `8710bf9b719a95f81c614d86fd1860250c5a8475`

## Executive summary

The FormatJS Intl polyfills are not conformant with the current ECMA-402 2027
draft. The most urgent problem is the conformance gate itself: Test262 is pinned
to October 2022, only seven of twelve polyfills have runnable targets, several
targets deliberately exclude tests, and NumberFormat's target returns success
even when the harness reports failures. Running those seven targets against a
September 2026 Test262 checkout produced 314 failed executions out of 1,518.
Some counts include both default and strict-mode execution, and the ListFormat
count is dominated by a broken locale-data test entry point, so the totals are
diagnostic rather than a conformance score.

The highest-confidence current-draft implementation gaps are:

1. `Intl.Locale` does not implement the finalized Locale Info algorithms,
   including region preference, weekday conversion, locale-specific collation
   data, and the standardized `getWeekInfo()` result shape.
2. `Intl.DurationFormat` omits current validation bounds and locale digital
   formatting data, including two-digit-hour behavior.
3. DateTimeFormat accepts offset time-zone identifiers with seconds and applies
   IANA links without the ECMA-402 primary-identifier country-boundary rules.
4. Several shared abstract operations are stale, notably
   `CanonicalizeUValue`, which is still a lowercase-only TODO.
5. NumberFormat, PluralRules, RelativeTimeFormat, DisplayNames, and Segmenter
   have reproducible failures in the current Test262 corpus.

The only active Stage 3 ECMA-402 proposal, Keep Trailing Zeros, is wholly absent
from NumberFormat and PluralRules. Temporal Intl integration and Intl
Era/MonthCode are Stage 4 but not yet integrated into the living ECMA-402 draft;
they are recorded as roadmap gaps rather than current-draft blockers.

## Standards baseline

This audit uses the [ECMA-402 2027 living draft](https://tc39.es/ecma402/) as
the conformance baseline. The latest published standard is
[ECMA-402, 13th edition (June 2026)](https://402.ecma-international.org/).
Proposal status comes from TC39's
[active ECMA-402 proposal tracker](https://github.com/tc39/proposals/blob/main/ecma402/README.md),
[finished proposal tracker](https://github.com/tc39/proposals/blob/main/ecma402/finished-proposals.md),
and [ECMA-402 integration tracker](https://github.com/tc39/ecma402/wiki/Proposal-and-PR-Progress-Tracking).

Locale-dependent output is implementation-defined in many places. This audit
only identifies a defect where the algorithm, accepted input, result structure,
canonicalization rule, or repository's own conformance test demonstrably differs
from the specification. It does not treat a different but permitted CLDR string
as a defect.

## Findings

### P0: the Test262 gate cannot establish conformance

`MODULE.bazel:260` pins Test262 to
`ade328d530525333751e8a3b58f02e18624da085`, dated 2022-10-25. Only DisplayNames,
ListFormat, Locale, NumberFormat, PluralRules, RelativeTimeFormat, and Segmenter
have runnable `test262` targets. Collator, DateTimeFormat, DurationFormat,
getCanonicalLocales, and supportedValuesOf do not.

The gate has additional false-negative paths:

- `packages/intl-numberformat/BUILD.bazel:438` does not pass
  `--errorForFailures`. Its current-suite log reported 80 failures while Bazel
  marked the target `PASSED`.
- `test262.BUILD` excludes known failures and several targets are tagged
  `manual`.
- `packages/intl-listformat/BUILD.bazel:182` builds its test bundle from
  `polyfill-force.ts` rather than the generated locale-data entry point. Its 88
  current-suite failures are therefore mostly test wiring failures, not evidence
  that the ListFormat algorithms themselves are wrong.

Fix this first: update the pin, make every target fail closed, load representative
locale data consistently, remove obsolete exclusions, and add targets for all
twelve polyfills.

### P0: Intl.Locale's finalized Locale Info implementation is stale

The current algorithms are in
[ECMA-402 abstract operations for Locale objects](https://tc39.es/ecma402/#sec-abstract-operations-for-locale-objects).
The 2026 suite reports 82 failures out of 334 executions, and source inspection
confirms the central failures:

- `weekInfoOfLocale` at `packages/intl-locale/index.ts:428` uses
  `loc.maximize().region`. The current
  [WeekInfoOfLocale](https://tc39.es/ecma402/#sec-weekinfooflocale) uses
  `RegionPreference`, so a valid `rg` override wins, then an `sd` subdivision,
  then the locale/likely-subtag region, then `001`.
- `getWeekInfo()` at `index.ts:767` writes a Unicode `fw` value such as `mon`
  directly into `firstDay`; the spec requires numeric weekdays 1 through 7.
  It also returns the removed `minimalDays` property. The standardized result is
  `{ firstDay, weekend }`.
- `calendarsOfLocale` and `hourCyclesOfLocale` use a maximized region and miss
  the current language-plus-preferred-region lookup and `rg`/`sd` priority.
- `collationsOfLocale` returns a global sorted
  `Intl.supportedValuesOf('collation')` list. The current
  [CollationsOfLocale](https://tc39.es/ecma402/#sec-collationsoflocale) requires
  Collator locale matching and locale-specific `co` data, falling back to
  sorted `['emoji', 'eor']` when no locale matches.
- `numberingSystemsOfLocale` can return the full generated locale list. The
  current draft returns only the default `nu` item (or `latn`). An approved but
  unmerged change must not be used as the current baseline.
- Unknown character direction is coerced to `ltr`, whereas the abstract
  operation can return `undefined` when direction cannot be determined.

Focused regression cases should cover `en-u-fw-mon`, `rg` and `sd` precedence,
language-plus-region preference data, no-match collations, and the exact own
properties of `getWeekInfo()`.

### P1: shared Unicode extension canonicalization is incomplete

`packages/intl-localematcher/abstract/CanonicalizeUValue.ts:3` only lowercases
the value and contains an explicit TODO for
[CanonicalizeUValue](https://tc39.es/ecma402/#sec-canonicalizeuvalue). The
specified operation also applies Unicode locale extension aliases. Because the
locale matcher is shared, this can affect every service constructor that
resolves Unicode extension keys, not just `Intl.Locale`.

Implement this once against generated CLDR alias data and exercise it through
Locale plus at least NumberFormat, DateTimeFormat, Collator, and PluralRules.

### P1: Intl.DurationFormat misses normative validation and digital-format data

The finalized [DurationFormat chapter](https://tc39.es/ecma402/#sec-durationformat-objects)
is normative in the current draft, but this package has no Test262 target.

- `packages/ecma402-abstract/DurationFormat/IsValidDurationRecord.ts` checks
  finiteness and mixed signs, but not the required bounds: absolute years,
  months, and weeks must be below `2^32`, and exact normalized seconds must be
  below `2^53`.
- Generated duration locale data exposes one time separator. The current
  `[[DigitalFormat]]` record distinguishes hour-minute and minute-second
  separators and contains `[[TwoDigitHours]]`.
- `GetDurationUnitOptions` supports a `twoDigitHours` input, but the main
  construction path does not provide the locale value, so digital hour style
  cannot follow the current algorithm.
- The repository knowledge base still calls DurationFormat Stage 3 even though
  it is part of the published standard.

Add a target before changing behavior. Prioritize mixed-sign and numeric-boundary
cases, primitive/empty inputs, digital style chains, distinct separators, and
two-digit-hour locales.

### P1: DateTimeFormat time-zone handling diverges from current rules

Current time-zone behavior is defined by
[Use of the IANA Time Zone Database](https://tc39.es/ecma402/#sec-use-of-the-iana-time-zone-database)
and `CreateDateTimeFormat`.

- `CanonicalizeTimeZoneName.ts` and `IsValidTimeZoneName.ts` accept and retain
  offset identifiers containing seconds or fractional seconds. DateTimeFormat
  accepts only offsets with minute precision and canonicalizes them as
  `±HH:MM`; a non-zero seconds component must be rejected.
- The time-zone link generator treats every IANA `backward` link as an alias to
  its target. ECMA-402's `PrimaryIdentifier` rules avoid following links across
  country boundaries and impose special UTC/renaming rules. For example, a
  blind `Atlantic/Reykjavik -> Africa/Abidjan` mapping crosses countries and is
  not a conforming primary-identifier decision.
- `Intl.supportedValuesOf('timeZone')` must expose only primary identifiers, and
  identifier lookup must be ASCII-case-insensitive and stable for the agent's
  lifetime.

There is generated Test262 infrastructure for DateTimeFormat, but no runnable
package target. Add it and validate canonical aliases, cross-country links, UTC
aliases, casing, offset boundaries, and `resolvedOptions().timeZone`.

### P1: current NumberFormat and PluralRules behavior has broad failures

Against current Test262, NumberFormat reported 80 failures out of 496 executions
and PluralRules reported 20 out of 104. High-signal failures include option
coercion/order, exception classes, rounding priority/increment, range behavior,
PluralRules `compactDisplay`, compact selection, `selectRange`, resolved option
order, and canonical plural-category order.

These are current-draft failures independent of the Stage 3 work below. Triage
them by abstract operation so fixes shared through `ecma402-abstract` are not
duplicated across packages.

### P1: smaller reproducible current-draft gaps

- **supportedValuesOf:** `packages/intl-supportedvaluesof/index.ts:64` switches
  directly on `key`. The
  [specified function](https://tc39.es/ecma402/#sec-intl.supportedvaluesof)
  first applies `ToString`, so string wrapper objects and objects coercing to a
  valid key are rejected incorrectly. This package has no Test262 target.
- **DisplayNames:** `CanonicalCodeForDisplayNames` accepts `_` as a separator in
  Unicode types, while the grammar admits hyphens. Current Test262 reports 6
  failures out of 112 executions.
- **Segmenter:** the repository already documents 35 Unicode word-break failures
  around Regional Indicator plus Extend, and the corresponding tests are
  skipped. Current Test262 additionally reports 8 failures out of 154, including
  locale-resolution behavior.
- **RelativeTimeFormat:** current Test262 reports 30 failures out of 158,
  including option-object prototype access, value coercion, parts, and numbering
  system resolution. These need separation from locale-data-dependent output.

### P2: Stage 3 Keep Trailing Zeros is not implemented

[Keep Trailing Zeros](https://tc39.es/proposal-intl-keep-trailing-zeros/) is the
only active Stage 3 ECMA-402 proposal. It affects NumberFormat and PluralRules.

`packages/ecma402-abstract/ToIntlMathematicalValue.ts` returns a bare `Decimal`,
discarding the proposal's `[[StringDigitCount]]` and
`[[StringFractionDigitCount]]`. Consequently the implementation cannot
distinguish string `"1.0"` from numeric `1` in formatting, ranges, plural
selection, or plural ranges. `FormatNumericToString` has no retained-precision
logic; `trailingZeroDisplay` only accepts `auto` and `stripIfInteger`, not the
new `stripToMinimum`; and PluralRules' public types do not accept string numeric
inputs.

Implementation needs an Intl mathematical-value record threaded end-to-end,
including both range endpoints. High-signal tests include decimal and exponent
strings, leading/trailing zeroes, signed zero, significant/fraction digit
options, percent and compact notation, `formatRange`, and `selectRange`.

### P2: Stage 4 proposals pending integration

The [Temporal Intl amendments](https://tc39.es/proposal-temporal/#sec-temporal-intl)
are absent. DateTimeFormat currently converts values numerically and has none of
the type-specific handling for `PlainDate`, `PlainTime`, `PlainDateTime`,
`PlainYearMonth`, `PlainMonthDay`, or `Instant`; direct ZonedDateTime formatting
must throw, while Temporal's own locale method uses its time zone. Range
endpoints must have the same Temporal type.

[Intl Era and MonthCode](https://tc39.es/proposal-intl-era-monthcode/) is also
Stage 4 but pending integration. Most of its behavior concerns Temporal and
non-ISO calendars. FormatJS currently documents Gregorian-only DateTimeFormat
support, so this becomes material when that scope expands. Its non-Temporal
requirements include the closed available-calendar set and resolving
`ca=islamic` to `islamic-tbla`.

These proposals should be tracked and tested, but they are not labeled failures
against the current living draft because their amendments have not yet landed
there.

## Package status matrix

| Polyfill | Current-draft audit status | Current Test262 target |
| --- | --- | --- |
| Collator | No high-confidence algorithm delta found; shared canonicalization and locale data need coverage | Missing |
| DateTimeFormat | Time-zone offset and primary-identifier gaps; Temporal is roadmap | Missing |
| DisplayNames | Unicode type grammar mismatch | 106/112 executions passed |
| DurationFormat | Validation bounds and digital-format data incomplete | Missing |
| getCanonicalLocales | No focused delta found; depends on shared locale parsing/canonicalization | Missing |
| ListFormat | No focused algorithm delta established; current target lacks locale data | 72/160 passed, not interpretable as implementation score |
| Locale | Multiple finalized Locale Info algorithm gaps | 252/334 passed |
| NumberFormat | Current rounding/coercion/range failures; Stage 3 retained precision absent | 416/496 passed, but Bazel falsely green |
| PluralRules | Current compact/range/order failures; Stage 3 retained precision absent | 84/104 passed |
| RelativeTimeFormat | Option/coercion/parts/locale-resolution failures | 128/158 passed |
| Segmenter | Known Unicode word-break and locale-resolution failures | 146/154 passed |
| supportedValuesOf | Missing key coercion; primary time-zone data needs validation | Missing |

## Validation performed

The repository's seven Test262 targets were first run at the pinned 2022 commit.
They were then run without source changes against Test262 revision
`419d3e0a2273ba01a3bfcbec423f2801425b8e93` dated 2026-09-02, using the existing
Bazel targets and a temporary external-repository override. Results:

| Target | Executions | Passed | Failed |
| --- | ---: | ---: | ---: |
| DisplayNames | 112 | 106 | 6 |
| ListFormat | 160 | 72 | 88 |
| Locale | 334 | 252 | 82 |
| NumberFormat | 496 | 416 | 80 |
| PluralRules | 104 | 84 | 20 |
| RelativeTimeFormat | 158 | 128 | 30 |
| Segmenter | 154 | 146 | 8 |

Test262 runs each applicable file in default and strict modes, so these are
execution counts rather than unique test-file counts. The suite was used to
confirm static findings, not to infer that every failure is an implementation
bug: ListFormat's missing test locale data, unsupported harness realm semantics,
and locale-data-sensitive assertions require separate triage.

## Recommended implementation order

1. Repair and expand the Test262 gate: update the pin, fail closed, normalize
   locale-data wiring, and cover all packages.
2. Bring `intl-locale` and shared locale-matching abstract operations up to the
   finalized 2027 algorithms.
3. Add DurationFormat and DateTimeFormat targets, then fix the validation and
   time-zone findings.
4. Triage current NumberFormat, PluralRules, RelativeTimeFormat, DisplayNames,
   and Segmenter failures by shared abstract operation.
5. Implement Keep Trailing Zeros behind dedicated proposal tests.
6. Add Temporal and Era/MonthCode coverage when their ECMA-402 integration text
   lands, or explicitly adopt the proposal specs earlier as project scope.
