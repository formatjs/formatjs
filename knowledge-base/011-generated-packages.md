# #formatjs_generated Packages

Generated TypeScript data is consumed through Node-style subpath imports under `#formatjs_generated/packages/...`. The generated files live in Bazel output, are exposed as direct Bazel `js_library` targets, and are bundled inline by package builds.

There is no generated npm package, per-package `package.json`, or `node_modules/#formatjs_generated/*` symlink layer.

## Packages

| Import prefix                                                     | Bazel target                                        | Output path                                   |
| ----------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------- |
| `#formatjs_generated/packages/intl-getcanonicallocales/*`         | `//packages/intl-getcanonicallocales:cldr_core_pkg` | `packages/intl-getcanonicallocales/*`         |
| `#formatjs_generated/packages/intl-locale/*`                      | `//packages/intl-locale:cldr_locale_pkg`            | `packages/intl-locale/*`                      |
| `#formatjs_generated/packages/intl-numberformat/*`                | `//packages/intl-numberformat:cldr_number_pkg`      | `packages/intl-numberformat/*`                |
| `#formatjs_generated/packages/generated/cldr-supported-locales/*` | `//packages/generated/cldr-supported-locales:pkg`   | `packages/generated/cldr-supported-locales/*` |
| `#formatjs_generated/packages/intl-supportedvaluesof/*`           | `//packages/intl-supportedvaluesof:cldr_sv_pkg`     | `packages/intl-supportedvaluesof/*`           |
| `#formatjs_generated/packages/intl-datetimeformat/*`              | `//packages/intl-datetimeformat:tz_pkg`             | `packages/intl-datetimeformat/*`              |
| `#formatjs_generated/packages/generated/unicode/*`                | `//packages/generated/unicode:pkg`                  | `packages/generated/unicode/*`                |

## Pipeline

1. Package scripts produce `.ts` data files with `generate_package_file()`.
2. `formatjs_generated_package()` compiles those files to `.js` and `.d.ts` with `oxc_transpiler`.
3. The compiled outputs are exposed as direct `js_library` targets.
4. Consumers import with `#formatjs_generated/<output-path>/<file>.js` and list the matching generated target in `deps`.

Example:

```typescript
import {timezones} from '#formatjs_generated/packages/intl-locale/timezones.js'
import links from '#formatjs_generated/packages/intl-datetimeformat/links.js'
import {S_UNICODE_REGEX} from '#formatjs_generated/packages/generated/unicode/regex.js'
```

```starlark
formatjs_library(
    name = "my-package",
    deps = [
        "//packages/intl-locale:cldr_locale_pkg",
        "//packages/intl-datetimeformat:tz_pkg",
        "//packages/generated/unicode:pkg",
    ],
)
```

## Resolution

The root `BUILD.bazel` declares `gazelle:resolve_regexp` mappings for each generated output path prefix so Gazelle preserves direct generated deps.

`packages_tsconfig()` and `generate_ide_tsconfig_json()` add a depth-aware TypeScript `#formatjs_generated/*` path entry. It prefers `bazel-bin/*` for local IDE resolution and keeps `*` as a Bazel sandbox fallback.

Rolldown and Vitest carry the same prefix mappings so package bundles and tests resolve generated imports without a node_modules symlink.

Root `package.json` includes a `#formatjs_generated/*` import entry for unbundled Node execution in Bazel runfiles.

## Key Files

| File                       | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `tools/generated.bzl`      | Generation and direct generated `js_library` macro |
| `tools/tsconfig.bzl`       | Build-time TypeScript path mappings                |
| `tools/index.bzl`          | IDE `tsconfig.json` path mappings                  |
| `tools/rolldown-bundle.ts` | Bundler resolver mappings                          |
| `tools/vitest.config.mjs`  | Test runtime resolver mappings                     |
| `BUILD.bazel`              | Gazelle generated import directives                |
