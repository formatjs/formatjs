# Patches

This contains 2 patches

## @bazel/typescript

We modified `ts_project` to insert `LinkablePackageInfo` so we can reference packages in our monorepo by their names in `package.json`. This makes the behavior just like `lerna` or `yarn`.
See https://github.com/bazelbuild/rules_nodejs/pull/1898#issuecomment-646666257 for more context

## test262-harness

We modified `bin/run.js` to set `exitCode = 1` when a test fails. This allows us to use `test262_harness_test` rule in bazel.
