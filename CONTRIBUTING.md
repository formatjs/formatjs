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

You can build & test with `pnpm`. At the moment version >= 9 is not supported:

```sh
pnpm i && pnpm t
```

### Build System Architecture

This repository uses a highly optimized TypeScript build pipeline with Bazel:

#### Fast Parallel Type Checking with tsgo

Type checking is performed using [tsgo](https://github.com/microsoft/TypeScript/tree/main/packages/ts-native-preview) from `@typescript/native-preview`, a native TypeScript type checker that's significantly faster than `tsc`:

- Type checking runs in parallel with code generation
- Uses `no_emit = True` to skip generating files (only validates types)
- Configured via the `transpiler` attribute in `ts_project` targets

#### Fast Transpilation with oxc-transform

Code generation uses [oxc-transform](https://oxc.rs/docs/guide/usage/transform.html), a Rust-based transpiler:

- **439x faster** than tsc for JavaScript transpilation
- **20-40x faster** than tsc for TypeScript declaration generation
- Handles both TypeScript → JavaScript and `.d.ts` file generation
- Respects `verbatimModuleSyntax` for proper type-only import handling
- Uses isolated declarations for fast `.d.ts` generation
- **Note**: Source code must avoid rest parameters with default values (e.g., `...[value, options = {}]`) as oxc's isolated declarations incorrectly preserves these in `.d.ts` files, causing tsc errors

#### How It Works

For every TypeScript compilation target, two separate Bazel targets are created:

1. **Type Check Target** (`<name>-typecheck`):
   - Uses tsgo with `no_emit = True`
   - Runs in parallel with transpilation
   - Fast type validation without generating files

2. **Transpile Target** (`<name>`):
   - Uses oxc-transform for both `.js` and `.d.ts` file generation
   - Declaration files use isolated declarations for speed
   - Preserves directory structure

This separation allows both operations to run in parallel, dramatically improving build times.

#### Type Safety Requirements

The repository uses `verbatimModuleSyntax: true` in `tsconfig.json`. This means:

- **Type-only imports must use `import type`**:
  ```typescript
  // ✅ Correct
  import type { MyType } from './types.js'

  // ❌ Wrong - will cause build errors
  import { MyType } from './types.js'
  ```

- **Type-only exports must use `export type`**:
  ```typescript
  // ✅ Correct
  export type { MyType } from './types.js'

  // ❌ Wrong - will cause runtime errors
  export { MyType } from './types.js'
  ```

This ensures compatibility with fast transpilers that operate in isolated mode without full type information.

#### Implementation Files

The transpiler infrastructure is located in:

- [`tools/index.bzl`](tools/index.bzl) - Main compilation macros (`ts_compile`, `ts_compile_node`)
- [`tools/vitest.bzl`](tools/vitest.bzl) - Test compilation with tsgo
- [`tools/oxc_transpiler.bzl`](tools/oxc_transpiler.bzl) - Custom Bazel rule for oxc-transform
- [`tools/oxc-transpiler/`](tools/oxc-transpiler/) - Node.js wrapper for oxc-transform CLI

### Releases

Releases are automated via GitHub Actions. To publish a new release:

1. Bump package versions by running the prerelease script locally:

```sh
# Make sure you have GH_TOKEN setup as indicated by:
# https://github.com/lerna/lerna/blob/05ad1860e2da7fc16c9c0a072c9389e94792ab64/commands/version/README.md#--create-release-type
GH_TOKEN=xxxxxxx npm run prerelease
```

2. Commit and push the version changes to the `main` branch

3. GitHub Actions will automatically build and publish all packages to npm using [Trusted Publishing (OIDC)](https://docs.npmjs.com/trusted-publishers/)

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

#### Regenerate all CLDR data at once

To regenerate all CLDR-related data files across all packages:

```sh
bazel run //:cldr-gen
```

This will run all CLDR generation targets in parallel (identified by the `cldr` tag).

#### Regenerate specific CLDR data

1. Check out `./BUILD.bazel` file for generatable data — which are identifiable via `generate_src_file()` call

```starlark
   generate_src_file(
     name = "regex",
     ...
   )
```

2. Run update script

```sh
   bazel run //packages/icu-messageformat-parser:regex.update
```

3. Verify

```sh
   bazel run //packages/icu-messageformat-parser:regex
```

### Working on `formatjs.github.io` website

The documentation website is built with Vike (React framework with SSR). To run the website locally:

```sh
bazel run //docs:serve
```

Or using npm scripts:

```sh
npm run docs
```

To build the production site:

```sh
bazel build //docs:dist
```

The documentation is automatically deployed to GitHub Pages when changes are pushed to the `main` branch via the GitHub Actions workflow.
