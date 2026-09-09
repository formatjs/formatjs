# Test262 conformance baseline

Measured 2026-09-09 against Test262 `419d3e0a2273ba01a3bfcbec423f2801425b8e93`,
using the pinned Node 26.8.1 Test262 host. Counts include strict/default executions.
All cases in each of the twelve upstream directories are included. No test is
excluded because it fails.

| Polyfill            | Executed | Polyfill failures | Native failures | Combined failures |
| ------------------- | -------: | ----------------: | --------------: | ----------------: |
| collator            |      130 |                 2 |               0 |                 2 |
| datetimeformat      |      488 |               160 |              52 |               160 |
| displaynames        |      114 |                 2 |               0 |                 2 |
| durationformat      |      220 |                 0 |               4 |                 0 |
| getcanonicallocales |       76 |                 0 |               2 |                 0 |
| listformat          |      162 |                 2 |               0 |                 2 |
| locale              |      336 |                 4 |              22 |                 4 |
| numberformat        |      498 |                 8 |               0 |                 8 |
| pluralrules         |      106 |                 2 |               0 |                 2 |
| relativetimeformat  |      160 |                 2 |               0 |                 2 |
| segmenter           |      158 |                 4 |               0 |                 4 |
| supportedvaluesof   |       50 |                 2 |               6 |                 2 |

Total: 2,498 executions, 2,310 polyfill passes, 188 polyfill failures. The native
control fails 86 executions; 44 failing cases overlap. Overlap does not prove
a polyfill is correct: each failure still needs comparison with the selected
spec and test's feature metadata.

Combined: 2,498 executions, 2,310 passes, 188 failures.

Combined installation adds 2 failing executions; 2 isolated failures now pass.
Two Locale branding cases pass with the installed getCanonicalLocales polyfill.
Two RelativeTimeFormat cases pass because combined enumeration omits numbering
systems that the NumberFormat polyfill does not support; this is not broader
numbering-system conformance.
Compact PluralRules now passes independently of NumberFormat locale data.
The extra failures concern NumberFormat dependencies and optional collation data. Full raw reports accompany Bazel
test outputs; the checked-in baselines preserve every remaining diagnostic.

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
5. Fix failures from combined installation coverage, where all 12 polyfills
   replace native Intl dependencies in every realm.
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

## Combined installation

`bazel test //tools/test262:combined` runs each upstream suite after all twelve
polyfills are installed in dependency order, including in nested realms.
Each package keeps its isolated target. Combined failures have separate reviewed
baselines under `tools/test262/baselines/`; neither denominator excludes failures.
Use `//tools/test262:combined-<polyfill>-strict` for a direct zero-failure check.

Combined suites use four harness workers with matching CPU reservations. This
keeps full-suite execution within CI time limits while preserving per-test
process isolation and the complete test selection.

Dynamic Test262 preludes share `tools/test262/locales.bzl`, covering upstream
locale metadata and parent locales. This includes Indian English grouping and
Polish NumberFormat data used by RelativeTimeFormat in combined installation.
Packages load only entries with standalone CLDR data files; aliases remain a
locale-registration concern.

Shared locale fixtures remove four Indian grouping failures in each mode and
two combined French compact-plural failures. Portuguese range and Polish
grouping diagnostics now reflect loaded locale data; those bugs remain tracked.

ASCII locale parsing removes four combined RegExp-statics failures in Collator
and NumberFormat. Isolated getCanonicalLocales remains at zero failures.

Minute/second-only matching removes four fractional-second formatting failures in
each mode. Range equality and flexible day periods remain failing; their
diagnostics now reflect the newly selected patterns.

Calendar negotiation supports Gregorian and ISO 8601 and falls back for other
requests. Six DateTimeFormat failures per mode are fixed; Chinese-calendar and
Era-monthcode proposal failures remain tracked.

Standalone PluralRules now uses its own compact exponent tables for the nine
CLDR locales with c/e operands. Two isolated failures are fixed; combined
selection no longer depends on NumberFormat locale data.

The remaining DateTimeFormat `numbering-system.js` failures reach the Han decimal
time pattern: Test262 expects ASCII space before `AM`, while CLDR 48.2 supplies
U+202F. Digit substitution, decimal separators and two-digit fields pass. A unit
test verifies the CLDR output and that joining `formatToParts()` reproduces it.
These executions remain visible in the raw failure counts. ECMA-402 11.2.3 makes
locale data implementation-defined ([source line 222](https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L222))
and recommends CLDR ([line 854](https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L854)).
