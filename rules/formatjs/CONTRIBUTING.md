# How to Contribute

## Using devcontainers

If you are using [devcontainers](https://code.visualstudio.com/docs/devcontainers/containers)
and/or [codespaces](https://github.com/features/codespaces) then you can start
contributing immediately and skip the next step.

## Formatting

Starlark files should be formatted by buildifier.
We suggest using a pre-commit hook to automate this.
First [install pre-commit](https://pre-commit.com/#installation),
then run

```shell
pre-commit install
```

Otherwise later tooling on CI will yell at you about formatting/linting violations.

## Updating BUILD files

Some targets are generated from sources.
Currently this is just the `bzl_library` targets.
Run `bazel run //:gazelle` to keep them up-to-date.

## Using this as a development dependency of other rules

You'll commonly find that you develop in another WORKSPACE, such as
some other ruleset that depends on rules_formatjs, or in a nested
WORKSPACE in the integration_tests folder.

Use a local override in the consuming module:

```starlark
bazel_dep(name = "rules_formatjs", version = "0.0.0")
local_path_override(
    module_name = "rules_formatjs",
    path = "/path/to/formatjs/rules/formatjs",
)
```

This keeps the override scoped to the consuming workspace.

## Releasing

Release Please opens or updates a version bump PR from Conventional Commits.
Merging that PR creates the tag and GitHub release, then builds release assets,
creates attestations, and opens the Bazel Central Registry PR automatically.

Do not choose or push a tag manually. See
[docs/releasing.md](docs/releasing.md) for setup, checks, monitoring, and
recovery.
