# Patches

This contains 2 patches

## test262-harness

We modified `bin/run.js` to set `exitCode = 1` when a test fails. This allows us to use `test262_harness_test` rule in bazel.
