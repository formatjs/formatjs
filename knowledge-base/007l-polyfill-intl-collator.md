# @formatjs/intl-collator

**ECMA-402 Section 10** - `Intl.Collator`

## Current Status

`@formatjs/intl-collator` has landed as the FormatJS `Intl.Collator` polyfill.
The stack was consolidated before merge into:

- `feat(@formatjs/intl-collator): add locale collation data pipeline`
- `feat(@formatjs/intl-collator): implement tailored locale comparison`
- `test(@formatjs/intl-collator): add collator conformance tests`

The npm package name was bootstrapped with a tiny `0.0.0` placeholder package
so npm trusted publishing/OIDC can be configured before the first real release.

## Public Surface

The package follows the standard FormatJS polyfill entrypoint shape:

- `index.ts`
- `polyfill.ts`
- `polyfill-force.ts`
- `should-polyfill.ts`

It implements:

- `Intl.Collator(locales, options)`
- `Intl.Collator.supportedLocalesOf(locales, options)`
- `Intl.Collator.prototype.compare`
- `Intl.Collator.prototype.resolvedOptions()`

Supported option plumbing includes:

- `usage`: `"sort"` and `"search"`
- Unicode extension keys: `co`, `kn`, and `kf`
- `numeric`
- `caseFirst`
- `sensitivity`
- `ignorePunctuation`
- cached bound compare functions

## Data Sources

The collator data pipeline uses CLDR common data rather than CLDR JSON packages:

- `common/uca/FractionalUCA_SHORT.txt` for root CLDR collation elements
- `common/collation/*.xml` for locale collation metadata and LDML tailorings
- generated CLDR collation package `@formatjs_generated/cldr.collation`

CLDR common is provided to Bazel through the pinned `cldr_common` archive. Keep
that archive aligned with the rest of the repo's CLDR version family when
updating CLDR data.

## Build-Time Pipeline

The build-time scripts live in `packages/intl-collator/scripts/`, which is its
own Bazel package. Keep script-only parser sources, generator binaries, and
parser tests out of the parent runtime target. This avoids mixing build-time XML
parsing dependencies with published runtime code.

Important script targets:

- `//packages/intl-collator/scripts:parsers`
- `//packages/intl-collator/scripts:parsers_test`
- `//packages/intl-collator/scripts:generate-root-data`
- `//packages/intl-collator/scripts:generate-locale-data`
- `//packages/intl-collator/scripts:generate-tailoring-data`

Important generated package targets:

- `//packages/generated/cldr-collation:root_data`
- `//packages/generated/cldr-collation:locale_data`
- `//packages/generated/cldr-collation:tailoring_data`
- `//packages/generated/cldr-collation:pkg`

## Parser Notes

- UCA parsing is purpose-built for `FractionalUCA_SHORT.txt`.
- LDML collation XML parsing uses `fast-xml-parser`; do not replace it with
  ad hoc XML string parsing.
- The LDML rule grammar inside collation rule strings is still purpose-built.
- Keep parser regexes hoisted to module-level constants for performance and to
  avoid recompiling expressions in hot loops.
- `generate_package_file` actions must include runtime parser package inputs
  such as `//:node_modules/fast-xml-parser` in `data` when the generator imports
  a parser that imports that package. Adding the npm package only to the
  `ts_binary(data = ...)` can pass locally but fail on Linux action runfiles.

## Runtime Model

Runtime comparison consumes generated root and locale collation data:

- root collation data is stored as packed elements and a longest-match trie
- locale metadata exposes supported collation types and default collation
- tailoring data applies locale-specific LDML rule effects
- comparison preserves existing `numeric`, `caseFirst`, and sensitivity behavior

Fallback implicit weights are used for code points not present in the root data.

## Tests

Primary validation targets:

```sh
bazel build //packages/generated/cldr-collation:pkg //packages/intl-collator //packages/intl-collator/scripts:generate-tailoring-data //packages/intl-collator/scripts:generate-locale-data //packages/intl-collator/scripts:generate-root-data
bazel test //packages/intl-collator:intl-collator_test //packages/intl-collator/scripts:parsers_test //conformance-tests/icu4j:intl_collator_conformance_test
```

The conformance test data compares the polyfill against ICU4J and native Node
`Intl.Collator`. Keep that test broad when changing generated data or comparison
behavior.

## Release Notes

- The package name exists on npm as `@formatjs/intl-collator@0.0.0`.
- The placeholder exists only to enable npm trusted publishing setup.
- The first real release should come from the normal Release Please automation
  after npm OIDC is configured.
