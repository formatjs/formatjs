# Test262 result accounting

The wrapper invokes the upstream harness with `--errorForFailures` and checks
its JSON results against its process status. Empty/malformed results, duplicate
executions, and baseline drift fail the gate. Tracked failures are executed and
reported as failures, never skipped or renamed passes.

Package `test262-baseline.json` files pin the execution count and failure
messages by upstream path and execution scenario. Remove an entry only after
reviewing why it passes. A changed pin or suite selection requires reviewing
both the counts and the failure list. Reports retain full diagnostics in
`results.json`; baseline messages omit environment-dependent stack frames.

Use `:test262-strict` to require zero failures. Normal `:test262` targets guard
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
crashes and empty diagnostics are runner errors, never baseline entries.

Baselines cover individual polyfill installations. Combined-polyfill coverage
remains a follow-up; dependencies may use native Intl in individual suites.
