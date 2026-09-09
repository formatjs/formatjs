# Test262 conformance baseline

Measured 2026-09-07 against Test262 `419d3e0a2273ba01a3bfcbec423f2801425b8e93`,
using the pinned Node 24.14.0 host. Counts include strict/default executions.
All cases in each of the twelve upstream directories are included. No test is
excluded because it fails.

| Polyfill            | Executed | Polyfill failures | Native failures |
| ------------------- | -------: | ----------------: | --------------: |
| collator            |      130 |                34 |               6 |
| datetimeformat      |      488 |               276 |             154 |
| displaynames        |      114 |                 6 |               0 |
| durationformat      |      220 |                84 |              22 |
| getcanonicallocales |       76 |                32 |               2 |
| listformat          |      162 |                 4 |               0 |
| locale              |      336 |                60 |              26 |
| numberformat        |      498 |                44 |               2 |
| pluralrules         |      106 |                 4 |              16 |
| relativetimeformat  |      160 |                14 |               2 |
| segmenter           |      158 |                10 |               0 |
| supportedvaluesof   |       50 |                 8 |               8 |

Total: 2,498 executions, 1,922 polyfill passes, 576 polyfill failures. The native
control fails 238 executions; 200 failing cases overlap. Overlap does not prove
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
- Both modes use stable Node settings. Its experimental Temporal implementation
  crashes in calendar tests, so missing Temporal support remains an explicit
  failure (124 DateTimeFormat executions lack Temporal in both modes). Host crashes and empty diagnostics cannot become baseline entries.
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
