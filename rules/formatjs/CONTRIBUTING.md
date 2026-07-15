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

To always tell Bazel to use this directory rather than some release
artifact or a version fetched from the internet, run this from this
directory:

```sh
OVERRIDE="--override_repository=rules_formatjs=$(pwd)"
echo "common $OVERRIDE" >> ~/.bazelrc
```

This means that any usage of `@rules_formatjs` on your system will point to this folder.

## Releasing

The release workflow chooses the next version from Conventional Commits, creates
the tag and GitHub release, and opens the Bazel Central Registry PR. It also
runs on a schedule.

To start a normal release without waiting for the schedule, dispatch the
no-input tag workflow on `main`:

```shell
gh workflow run tag.yaml --repo formatjs/rules_formatjs --ref main
```

Do not push a tag manually for a normal patch or minor release. See
[docs/releasing.md](docs/releasing.md) for preflight checks, monitoring, major
releases, and recovery.
