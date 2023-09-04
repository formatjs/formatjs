# @soxhub/formatjs-cli-lib

For use in the AuditBoard application we have added hbs_extractor.
The @soxhub/formatjs-cli-lib is used in [tools/intl-extractor](https://github.com/soxhub/auditboard-frontend/blob/develop/tools/intl-extractor/worker.mjs#L1)

## Publish Package

In the root of the application.

```
npx bazel run //packages/cli-lib:cli-lib.publish
```

## Test

To run the `cli-lib` unit tests

```
npx bazel run //packages/cli-lib:unit_test
```

To run all the tests

```
pnpm test
```
