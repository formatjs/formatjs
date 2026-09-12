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
