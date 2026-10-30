# Test262 result accounting

Generated rules_js targets invoke the upstream harness with `--errorForFailures`.
For baseline gates, a shell test invokes the rules_js generated harness binary,
captures JSON, stderr, and the real exit code, then invokes the separate validator.
Reports are test outputs, never cached build outputs. Empty/malformed results, duplicate
executions, and baseline drift fail the gate. Tracked failures are executed and
reported as failures, never skipped or renamed passes.

Package `test262-baseline.json` files pin the execution count and failure
messages by upstream path and execution scenario. Bare Test262Error assertions
retain host stderr when the upstream validator omits their error name. Unknown
empty failures and fatal host diagnostics remain validation errors. Remove an entry only after
reviewing why it passes. A changed pin or suite selection requires reviewing
both the counts and the failure list. Reports retain full diagnostics in
`results.json`; baseline messages omit environment-dependent stack frames.

The `:test262-strict` and `:test262-native` targets use the generated
`test262_harness_bin.test262_harness_test` rule directly. Use `:test262-strict`
to fail on any harness-reported failure. Normal `:test262` targets guard
against regressions while the baseline is reduced. Do not interpret green
baseline checks as complete ECMA-402 conformance.

Hermes strict targets live under `//tools/test262:hermes-<polyfill>-strict`.
`//tools/test262:hermes-strict` runs all twelve suites against the bundled
native extensions with all locale data compiled. Each failing target keeps its
full JSON report in Bazel test outputs. Failing targets remain manual until
their failures are resolved; a passing subset does not establish full
conformance. The host enables Hermes ES6 block scoping and loads the pinned
Temporal polyfill before native extensions so Temporal cases execute.
Cross-realm cases still report Hermes host limitations. `:hermes` runs the
passing strict suites and baseline-gated suites in CI. Baselines track remaining
raw failures, including cross-realm tests, optional legacy constructors, and
locale-data-dependent assertions. Green baseline gates mean no regression;
`:hermes-strict` remains the raw conformance diagnostic.

Upstream runner contract: https://github.com/tc39/test262/blob/main/INTERPRETING.md

## Complete selection and host controls

All twelve polyfill suites include every test under their upstream directory.
There are no glob exclusions in `test262.BUILD`. The upstream revision is pinned
in `MODULE.bazel`. The prelude installs each polyfill in the initial realm and
recursively in realms created through `$262.createRealm`.

`:test262-native` runs the same selection without installing the polyfill and
fails on any native failure. It is a manual diagnostic control, not an excuse
to suppress a polyfill failure. All harness modes use checksum-pinned Node
26.8.1, with stable Temporal support and no experimental flags. An explicit
platform selector supplies the generated rules_js binary's node_toolchain;
repository host aliases are not used for remote execution. Normal build tools
retain Node 24.14.0. Realm fixtures verify Temporal in child and grandchild realms.
Host crashes and empty diagnostics are validation errors, never baseline entries.

Baselines cover both individual and combined polyfill installations. Run
`//tools/test262:combined` for all twelve combined suites. Dependencies may use
native Intl in individual suites; combined suites install all twelve polyfills.

Combined DateTimeFormat keeps the full shared locale set. Other combined suites
load English DateTimeFormat locale data: their cross-API checks use default
construction or enumerate calendars, numbering systems, and timezones in English.
All calendar implementations and timezone data remain installed in both profiles,
including in child realms. Other polyfills keep their existing locale data.
Do not narrow DateTimeFormat's own suite from locale metadata alone: tests also
request locales inside their bodies, and fallback can hide lost locale coverage.

### Comparing startup cost

The manual `:combined-supportedvaluesof-full-data` control runs the same 50
executions, baseline, and four workers as `:combined-supportedvaluesof`, with the
full DateTimeFormat locale set. Build both first, then run them separately:

```sh
bazel build //tools/test262:combined-supportedvaluesof //tools/test262:combined-supportedvaluesof-full-data
bazel test --nocache_test_results --local_test_jobs=1 //tools/test262:combined-supportedvaluesof-full-data
bazel test --nocache_test_results --local_test_jobs=1 //tools/test262:combined-supportedvaluesof
```

Alternate order across repeated pairs and compare test execution durations.
This measures one cross-API suite; it does not establish a full-suite or RBE speedup.

## Bazel execution

Realm preludes are deterministic generated inputs. Harness execution and report
capture happen at test time through the rules_js generated binary; the validator
runs afterward. Both paths use `TZ=UTC`. Ordinary Bazel test caching still applies,
but `--nocache_test_results` reruns the harness, including after a transient failure.

Raw reports, stderr, exit codes, and candidate baselines are available in Bazel's
undeclared test outputs. There is no `:test262-report` build action. Wall-clock
values remain available in raw diagnostics; baseline comparison normalizes only
the known shared clock-dependent endpoint. Empty/malformed results and exit-status
mismatches fail validation. Generated-rule fixtures execute at test time too.

DateTimeFormat and combined suites allow one hour for the complete suite because
calendar data increases per-process startup cost. Individual upstream cases still
have the same 30-second harness timeout; longer suite budgets do not suppress
case failures or change the selected tests.
