# Contributing

Pull requests are very welcome, but should be within the scope of the project, and follow the repository's code conventions. Before submitting a pull request, it's always good to file an issue, so we can discuss the details of the PR.

## Reporting a Bug

1. Ensure you've replicated the issue against `main`. There is a chance the issue may have already been fixed.

2. Search for any similar issues (both opened and closed). There is a chance someone may have reported it already.

3. Provide a demo of the bug isolated in a codesandbox.io. Sometimes this is not a possibility, in which case provide a detailed description along with any code snippets that would help in triaging the issue. If we cannot reproduce it, we will close it.

4. The best way to demonstrate a bug is to build a failing test. This is not required, however, it will generally speed up the development process.

## Submitting a pull request

1. [Fork](https://github.com/formatjs/formatjs/fork/) the repository.

1. Ensure that all tests are passing prior to submitting.

1. If you are adding new functionality, or fixing a bug, provide test coverage.

1. Follow syntax guidelines detailed below.

1. Push the changes to your fork and submit a pull request. If this resolves any issues, please mark in the body `fix #ID` within the body of your pull request. This allows for github to automatically close the related issue once the pull request is merged.

1. Last step, [submit the pull request](https://github.com/formatjs/formatjs/compare/)!

## Development

### Requirements

- [`bazel`](https://bazel.build/)
- [`docker`](https://www.docker.com/)

You can build & test with `pnpm`. At the moment version >= 9 is not supported:

```sh
pnpm i && pnpm t
```

To run examples:

```sh
npm run examples
```

Releases can be done with the following steps:

```sh
# Make sure you have GH_TOKEN setup as indicated by:
# https://github.com/lerna/lerna/blob/05ad1860e2da7fc16c9c0a072c9389e94792ab64/commands/version/README.md#--create-release-type
GH_TOKEN=xxxxxxx npm run prerelease
bazel build :dist
mkdir ../formatjs2
cp -rf dist/bin/formatjs_dist/ ../formatjs2/
# Use `--access=public` to publish new packages with `@formatjs/` scope.
cd ../formatjs2
npx pnpm -r publish --access=public
```

### Updating tzdata version

`tzdata` requires `Docker` to be installed. This is because tzdata compilation requires `make`.

1. Change `IANA_TZ_VERSION` in [packages/intl-datetimeformat/index.bzl](https://github.com/formatjs/formatjs/blob/main/packages/intl-datetimeformat/index.bzl) to the desired version

1. Update the sha256 for tzdata & tzcode targets

1. Run the Docker image & update the tz_data.tar.gz

```sh
bazel run //packages/intl-datetimeformat:update_tz_data
```

1. Test to make sure everything passes

1. New TimeZones or renames of TimeZones are not updated using the Bazel script. You need to manually update `index.bzl`.

### Updating test snapshots

You can update the snapshot by running the test target + `_update_snapshots`, e.g

```sh
bazel run //packages/cli/integration-tests:compile_folder_integration_test_update_snapshots
```

### Generating CLDR data

1. Check out `./BUILD` file for generatable data — which are identifiable via `generate_src_file()` call

```starlark
   generate_src_file(
     name = "regex",
     ...
   )
```

2. Create an empty file with the given `src` attribute — path is relative to module root

```sh
   touch packages/icu-messageformat-parser/regex.generated.ts
```

3. Run update script

```sh
   bazel run //packages/icu-messageformat-parser:regex.update
```

4. Verify

```sh
   bazel run //packages/icu-messageformat-parser:regex
```

### Working on `formatjs.github.io` website

We use [docusaurus](https://docusaurus.io/) for documentation. To run the website locally:

```sh
cd website
npx docusaurus start
```

To deploy:

```sh
cd website
GIT_PASS="<your_personal_token>" GIT_USER="your_username" DEPLOYMENT_BRANCH=main npx docusaurus deploy
```
