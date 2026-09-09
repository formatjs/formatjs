# Test262 conformance baseline

Measured 2026-09-09 against Test262 `419d3e0a2273ba01a3bfcbec423f2801425b8e93`,
using the pinned Node 26.8.1 Test262 host. Counts include strict/default executions.
All cases in each of the twelve upstream directories are included. No test is
excluded because it fails.

| Polyfill            | Executed | Polyfill failures | Native failures |
| ------------------- | -------: | ----------------: | --------------: |
| collator            |      130 |                16 |               0 |
| datetimeformat      |      488 |               242 |              52 |
| displaynames        |      114 |                 6 |               0 |
| durationformat      |      220 |                12 |               4 |
| getcanonicallocales |       76 |                32 |               2 |
| listformat          |      162 |                 4 |               0 |
| locale              |      336 |                28 |              22 |
| numberformat        |      498 |                24 |               0 |
| pluralrules         |      106 |                 4 |               0 |
| relativetimeformat  |      160 |                 8 |               0 |
| segmenter           |      158 |                10 |               0 |
| supportedvaluesof   |       50 |                 6 |               6 |

Total: 2,498 executions, 2,106 polyfill passes, 392 polyfill failures. The native
control fails 86 executions; 56 failing cases overlap. Overlap does not prove
a polyfill is correct: each failure still needs comparison with the selected
spec and test's feature metadata.

## Harness guarantees

- Baseline gates execute all tests and fail on changed counts, new failures,
  changed diagnostics, or unexpected passes.
- Strict/native targets directly use the rules_js generated harness test rule
  with `--errorForFailures`. Native controls install no polyfills.
- Baseline tests invoke the generated harness binary, capture its real exit code
  and JSON, then invoke a separate validator. Reports are test outputs, not build
  artifacts. `--nocache_test_results` reruns the harness. Realm preludes remain
  deterministic generated build inputs.
- IIFE preludes avoid collisions with test variables. Polyfills are installed
  recursively into Test262 child realms.
- All harness modes use Node 26.8.1 with stable Temporal support. The separate
  toolchain is selected by target platform and checksum-pinned; normal build
  tools retain Node 24.14.0. Fixtures verify Temporal in nested realms.
  Host crashes and empty diagnostics cannot become baseline entries.
- Full JSON reports and candidate baselines are written to undeclared Bazel
  test outputs. Updating a candidate baseline requires review.

## Work remaining

1. Fix runtime errors by spec algorithm, removing baseline entries as they pass.
   NumberFormat range validation, branding, and option key order
   are distinct reviewable clusters.
2. Repair locale data and locale selection in ListFormat and RelativeTimeFormat.
3. Implement missing Locale variants/region overrides and PluralRules notation
   behavior. Check proposal feature metadata against the targeted ECMA-402 draft.
4. Classify DateTimeFormat/DurationFormat Temporal cases with native controls.
   Native failures must not be mistaken for proof that upstream tests are wrong.
5. Add combined installation coverage so native dependencies cannot hide
   interactions among polyfills.
6. Reduce all baselines to zero where implementable. Document any remaining
   runtime limitation per test and spec requirement, never as a blanket skip.

## Commands

```sh
bazel test //packages/intl-numberformat:test262
bazel test //packages/intl-numberformat:test262-strict
bazel test //packages/intl-numberformat:test262-native
```

A green baseline gate means no regression from the reviewed failure list. It
does not mean full conformance. A strict target is the zero-failure check.

The NaN exceptZero sign fix removes 20 failures across format and formatToParts
in five locales. NumberFormat counts are tracked in the table above.

Range endpoint validation removes four failures: both range methods now reject
undefined endpoints before coercion.

Symbol coercion removes eight NumberFormat failures and two PluralRules failures.
Symbols now throw TypeError instead of becoming NaN in ToIntlMathematicalValue.

NumberFormat methods use concise method definitions to match built-in
non-constructibility, including range methods, formatToParts, resolvedOptions,
and supportedLocalesOf.

ToRawPrecision reports `e - p + 1` as its rounding magnitude. Reporting only
`e` incorrectly favored fraction digits for morePrecision and significant digits
for lessPrecision when both digit constraints were present.

NumberFormat internal-slot reads no longer allocate records. Only constructor
initialization can create a brand; formatting methods validate it before coercion.

TimeClip truncates finite timestamps toward zero, including negative fractions.
The previous finite-number branch returned the fraction unchanged, causing local
calendar conversion to place negative fractions in the preceding second.

DateTimeFormat methods use concise definitions for built-in non-constructibility.
Constructor and supportedLocalesOf lengths reflect their required parameters.

The Node 26 harness refresh removes 18 missing-Temporal failures (14 DateTimeFormat,
4 DurationFormat). Another 120 diagnostics now expose actual Temporal integration
failures instead of missing-global errors. These are runtime coverage gains, not
implementation fixes. Raw host stderr preserves bare Test262Error assertions;
unknown empty diagnostics and crashes still fail validation.

DurationFormat exposes the required constructor/method lengths and toStringTag.
Its resolvedOptions result follows table order and omits unset fractionalDigits.

DurationFormat emits the duration sign only on its first displayed unit and
preserves negative zero across the BigDecimal-to-NumberFormat boundary.

Numeric DurationFormat fields disable grouping. Duration integers enter BigDecimal
through BigInt so large Number values retain their exact mathematical integer
instead of their shortest rounded decimal representation.

GetDurationUnitOptions propagates numeric/fractional styles before reading display
options and validates fractional units after normalization. Default minutes and
seconds stay displayed when following a numeric time unit.

Numeric duration formatting retains zero minutes between displayed hours and
seconds, considering sub-second values before rounding when deciding visibility.

Locale resolution uses an internal record isolated from inherited extension-key
setters on `Object.prototype`.
