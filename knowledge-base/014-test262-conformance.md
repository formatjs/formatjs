# Test262 conformance baseline

Test262 pin `2a1ade303f72d3de80565c921d685222405c32ce` with CLDR 49. The Node
harness is pinned to 26.8.1. Counts include strict and non-strict executions
from all twelve selected Intl directories.

| Polyfill            | Executed per mode | Isolated failures | Combined failures | Hermes failures |
| ------------------- | ----------------: | ----------------: | ----------------: | --------------: |
| collator            |               130 |                 2 |                 2 |               2 |
| datetimeformat      |               492 |                 4 |                 4 |               4 |
| displaynames        |               114 |                 2 |                 2 |               2 |
| durationformat      |               220 |                 0 |                 0 |               0 |
| getcanonicallocales |                76 |                 0 |                 0 |               0 |
| listformat          |               162 |                 2 |                 2 |               2 |
| locale              |               380 |                 2 |                 2 |               2 |
| numberformat        |               502 |                 2 |                 2 |               2 |
| pluralrules         |               106 |                 2 |                 2 |               2 |
| relativetimeformat  |               160 |                 2 |                 2 |               2 |
| segmenter           |               158 |                 4 |                 4 |               4 |
| supportedvaluesof   |                50 |                 0 |                 0 |               0 |
| **Total**           |         **2,550** |            **22** |            **22** |          **22** |

Each mode passes 2,528 executions. Each raw report tracks 20 constructor
failures for a foreign `newTarget` with a non-object prototype. The spec takes
the fallback prototype from that constructor's realm.
[ECMA-262 §10.1.14 step 4](https://tc39.es/ecma262/#sec-getprototypefromconstructor)

Two DateTimeFormat cases expect ASCII space before `AM`.
TypeScript and Rust/Hermes tests verify the Han decimal digits and CLDR narrow
no-break space. ECMA-402 preserves the selected pattern's literal.
[ECMA-402 §11.5.4 step 15.b](https://tc39.es/ecma402/#sec-formatdatetimepattern)
[Test262 #3711](https://github.com/tc39/test262/issues/3711)

Independent ICU gates cover locale-sensitive NumberFormat and DateTimeFormat
behavior. Temporal has separate Test262 selections.

`//tools/test262:date-locale` checks all 12 pinned `intl402/Date` tests for the installed
`Date.prototype.toLocale*` methods. Each mode runs 24 cases and requires zero
failures. These counts are separate from the table. [ECMA-402 §20.4](https://tc39.es/ecma402/#sup-properties-of-the-date-prototype-object)

`//tools/test262:numeric-locale` checks all 18 pinned `intl402/Number` and
`intl402/BigInt` tests for the installed `toLocaleString` hooks. Each mode runs
36 cases and requires zero failures. [ECMA-402 §20.2.1](https://tc39.es/ecma402/#sup-number.prototype.tolocalestring)
[ECMA-402 §20.3.1](https://tc39.es/ecma402/#sup-bigint.prototype.tolocalestring)

## Harness guarantees

`tools/test262/runner` owns the TypeScript prelude generator, report validator,
and Node test runner. Gazelle maintains their sources and dependencies. The
parent package owns executable wiring and generated harness fixtures; it does
not need a directory-wide Gazelle ignore.

- Baseline gates execute all tests and fail on changed counts, new failures,
  changed diagnostics, or unexpected passes.
- Strict/native targets directly use the rules_js generated harness test rule
  with `--errorForFailures`. Native controls install no polyfills.
- Baseline tests invoke the generated harness binary, capture its real exit code
  and JSON, then invoke a separate validator. Reports are test outputs, not build
  artifacts. `--nocache_test_results` reruns the harness. Realm preludes remain
  deterministic generated build inputs.
- IIFE preludes avoid collisions with test variables. A small Node loader reads
  a generated payload file and evaluates it through `$262.evalScript`, repeating
  installation independently in child and grandchild realms. Both loader and
  payload are declared test inputs. Missing payloads and evaluation errors fail;
  no preinstalled realm or module exports are reused. Keeping the large payload
  outside eshost's generated per-test script avoids repeated wrapper compilation
  and large compiled-source copies. Locale/calendar/timezone data is unchanged.
- All harness modes use Node 26.8.1 with stable Temporal support. The separate
  toolchain is selected by target platform and checksum-pinned; normal build
  tools retain Node 24.14.0. Fixtures verify Temporal in nested realms.
  Host crashes and empty diagnostics cannot become baseline entries.
- Full JSON reports and candidate baselines are written to undeclared Bazel
  test outputs. Updating a candidate baseline requires review.

## Work remaining

The [2026-09-11 tracking report](./015b-test262-progress-2026-09-11.md) records
140 DateTimeFormat fixes, plus two combined calendar-enumeration fixes.
The table above counts the remaining constructor-realm and locale-data
failures. NumberFormat and DateTimeFormat pass the optional legacy construction
cases.

## Commands

```sh
bazel test //tools/test262:combined //tools/test262:hermes
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

Combined suites select DateTimeFormat data by use. DateTimeFormat keeps the full
shared locale set; the other eleven suites load only its English locale data.
Both profiles install all twelve polyfills, every calendar implementation, and
complete timezone data. Other polyfills' locale data and all upstream selections
and baselines stay unchanged. Retain the full DateTimeFormat profile: locale
metadata does not cover every locale requested inside test bodies, and fallback
can leave a reduced-data test green without exercising the intended patterns.

`//tools/test262:combined-supportedvaluesof-full-data` is a manual full-data
benchmark control for `:combined-supportedvaluesof`. Both use the same 50
executions, baseline, and four harness workers. The full-data control reserves
6GB for RBE; the English-data control reserves 2GB. Run them
separately with `--nocache_test_results --local_test_jobs=1`, alternate order,
and compare test durations after building both. See the
[benchmark commands](../tools/test262/README.md#comparing-startup-cost).

Before file-backed loading, three alternating uncached pairs on 2026-10-30
(Apple M4 Max, 36 GiB, Node 26.8.1) measured these test durations. Both targets were built first and ran
separately with one test action and four workers. Each run executed all 50 cases
with no failures.

| DateTimeFormat data | Runs (seconds)         | Median (seconds) |
| ------------------- | ---------------------- | ---------------: |
| Full locale set     | 83.998, 78.355, 82.347 |           82.347 |
| English             | 15.776, 15.561, 15.923 |           15.776 |

The median improved 5.22x (80.8% less time). The combined prelude shrank from
72,971,420 to 25,422,442 bytes. This is a local single-suite comparison, not a
full-suite or RBE measurement.

### File-backed loader benchmark

On the same host/runtime, three alternating uncached pairs compared the full-data
control at commit `c9adfada4` with file-backed loading. Both targets were prebuilt
and ran separately with `--nocache_test_results --local_test_jobs=1`, four workers,
and the same 50 executions. All runs passed. The 58,988,723-byte payload was
byte-identical; the loader replaced a 72,971,420-byte inline prelude with 637 bytes.

| Loader      | Runs (seconds)         | Median (seconds) |
| ----------- | ---------------------- | ---------------: |
| Inline      | 91.436, 88.798, 93.793 |           91.436 |
| File-backed | 9.999, 8.335, 8.974    |            8.974 |

The median improved 10.19x (90.2% less time). This isolates loader behavior in one
local suite; it is not an RBE or full-suite speedup claim. Local profiling
reduced sampled harness-parent RSS from 4.08 GiB to 177 MiB. Full-data workers
had median peak RSS of 645 MiB (maximum 880 MiB), so the four-worker DateTimeFormat targets and
full-data control reserve 6GB for RBE scheduling. The complete combined
DateTimeFormat baseline separately passed all 488 executions in 66.1 seconds,
with the same 18 tracked failures and full data retained.

Dynamic Test262 preludes share `tools/test262/locales.bzl`, covering upstream
locale metadata and parent locales. This includes Indian English grouping and
Polish NumberFormat data used by RelativeTimeFormat in combined installation.
Packages load only entries with standalone CLDR data files; aliases remain a
locale-registration concern.

Shared locale fixtures remove four Indian grouping failures in each mode and
two combined French compact-plural failures. Subsequent NumberFormat range and
numbering-system fixes also resolve the Portuguese range and Polish grouping cases.

ASCII locale parsing removes four combined RegExp-statics failures in Collator
and NumberFormat. Isolated getCanonicalLocales remains at zero failures.

Minute/second-only matching removes four fractional-second formatting failures in
each mode. Subsequent fixes resolve range equality at displayed precision and
flexible day periods using CLDR rules.

Calendar negotiation and conversion support all 16 Intl Era/Month Code calendars.
Calendar-specific CLDR patterns preserve leap months, related years, cyclic years,
and eras. All 30 previously tracked calendar executions now pass in each mode;
combined calendar enumeration also passes.

Standalone PluralRules now uses its own compact exponent tables for the nine
CLDR locales with c/e operands. Two isolated failures are fixed; combined
selection no longer depends on NumberFormat locale data.

## Temporal development selections

`packages/temporal` has eight partial classes plus Now. Strict selections total 4,986
executions per Node/Hermes source/optimized-bytecode mode; these stay separate
from the twelve complete Intl selections above. Current class counts and failure
areas live in [the package record](../packages/temporal/conformance-results.json)
and [package README](../packages/temporal/README.md).

Full diagnostics agree across all three modes but remain failing. Duration
passes 1,082/1,086 and ZonedDateTime 1,800/1,804. The 138-execution complete Now built-ins/intl402 corpus passes. Locale failures remain visible. Remaining calendars and Intl/Date
integration are implementation gaps, never exclusions. Negative assertions can
pass incidentally when a method is absent; aggregate counts do not establish
whole-method conformance.

Full Hermes development targets use Bazel's large test budget. The 1,790-execution
strict zoned suite and 1,072-execution Duration suite use medium budgets; per-case harness
limit stays 30 seconds. Timed-out/truncated JSON never counts as a completed
raw diagnostic. No new exclusions. See [implementation tracking](015-temporal.md).

Temporal installation adds 26 namespace/Date executions per mode, using the real
force entry as the Test262 prelude. Separate manual intl402/Temporal targets cover
all 4,080 scenarios, retaining every failure. The bare Hermes diagnostic lacks an
installed DateTimeFormat prerequisite; this is recorded, not an allowed exclusion.
Latest engine-specific results live in the Temporal conformance record.

Zoned strict selection now covers every non-locale built-ins family, including
complete since/until directories. Independent ICU identity fixtures check all
597 available IDs and 178,503 pairs in both TS and Rust. Country primaries remain
distinct even when transition records or present offsets coincide.

Native Rust plain-relative tests additionally port pinned Duration vectors for
zero values at date limits, ±1 ns nudged to 10^9 days, minimum-date rounding,
large clock/calendar endpoint overflow and week-prefix preservation. These ports
supplement independent ICU controls; they do not claim a native Test262 harness.
The TS range fix remains subject to the full existing strict selections.
