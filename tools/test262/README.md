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
