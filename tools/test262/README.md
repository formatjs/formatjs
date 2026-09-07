# Test262 result accounting

Generated rules_js targets invoke the upstream harness with `--errorForFailures`.
For baseline gates, `test262_harness_bin.test262_harness` captures JSON, stderr,
and the real exit code as declared build outputs. A separate validation test
checks the report against that exit code and the reviewed baseline. Empty/malformed results, duplicate
executions, and baseline drift fail the gate. Tracked failures are executed and
reported as failures, never skipped or renamed passes.

Package `test262-baseline.json` files pin the execution count and failure
messages by upstream path and execution scenario. Remove an entry only after
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
to suppress a polyfill failure. Both modes use the pinned Node host without
experimental flags. Node 24's experimental Temporal implementation crashes in
calendar tests; unavailable Temporal features remain explicit failures. Host
crashes and empty diagnostics are validation errors, never baseline entries.

Baselines cover individual polyfill installations. Combined-polyfill coverage
remains a follow-up; dependencies may use native Intl in individual suites.

## Bazel execution

The realm prelude is generated before execution. The validator does not resolve
the harness entry point, spawn Node, or create temporary preludes. Bazel owns
execution, caching, and output capture. Both build and test execution explicitly
use `TZ=UTC`. Baseline changes rerun validation without
rerunning the unchanged harness action.

Raw reports are declared outputs of `:test262-report`; use
`bazel cquery --output=files //packages/intl-numberformat:test262-report` to locate
them. Baseline tests also publish JSON reports and candidate baselines through
Bazel undeclared test outputs. Empty/malformed results and exit-status mismatches
fail validation. Real generated-rule fixtures cover passing/failing executions,
empty selections, and installation in child and grandchild realms.
