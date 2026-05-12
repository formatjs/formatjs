# Fuzzing

This directory contains the [OSS-Fuzz](https://github.com/google/oss-fuzz) fuzz
targets for FormatJS. OSS-Fuzz invokes [`build.sh`](./build.sh) inside its
`base-builder-javascript` image; everything here is intended to run in that
container, not as part of the FormatJS Bazel/pnpm workspace.

## Targets

- `fuzz_icu_messageformat_parser.js` — exercises
  `@formatjs/icu-messageformat-parser`'s `parse()` across the parser flag
  matrix.
- `fuzz_intl_messageformat.js` — drives the public `intl-messageformat`
  `IntlMessageFormat` constructor, `format()`, and `formatToParts()` over ten
  locales.
- `fuzz_icu_skeleton_parser.js` — covers `@formatjs/icu-skeleton-parser`'s
  number and date-time skeleton entry points.

## Build / dependency notes

- The fuzz workspace installs the published `@formatjs/*` and
  `intl-messageformat` packages from npm rather than building from the local
  Bazel sources. This keeps the OSS-Fuzz build path independent of the
  monorepo toolchain.
- The published packages are ESM-only. [`build.sh`](./build.sh) runs a
  targeted Babel ESM→CommonJS transform on `node_modules/@formatjs/*` and
  `node_modules/intl-messageformat` so Jazzer.js (which loads targets via
  CommonJS `require`) can pick them up. Other packages in `node_modules` are
  CommonJS already and are left alone.
- `@jazzer.js/core` is pinned to `^2`. Jazzer.js 4.0.0's prebuilt native
  addon requires `GLIBC_2.32`, which the current OSS-Fuzz base images
  (Ubuntu 20.04, glibc 2.31) don't provide. The pin can be dropped once the
  base images move past glibc 2.32.

## Running locally

The targets are designed to run under the OSS-Fuzz toolchain rather than
standalone. To reproduce a build locally, run the standard OSS-Fuzz helper
against the `formatjs` project at
[`google/oss-fuzz`](https://github.com/google/oss-fuzz):

```sh
python3 infra/helper.py build_fuzzers formatjs
python3 infra/helper.py check_build formatjs
python3 infra/helper.py run_fuzzer formatjs fuzz_icu_messageformat_parser
```
