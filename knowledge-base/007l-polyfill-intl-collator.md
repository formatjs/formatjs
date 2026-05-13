# @formatjs/intl-collator Plan

**ECMA-402 Section 10** - `Intl.Collator`

## Purpose

Plan for a full `Intl.Collator` polyfill that supports locale-aware string comparison for sorting and searching.

`Intl.Collator` is different from the formatter polyfills: the hard part is not display data, but compiling the Unicode Collation Algorithm plus CLDR locale tailorings into compact data that can produce stable sort keys at runtime.

## Spec Surface

The package should implement:

- `Intl.Collator(locales, options)`
- `Intl.Collator.supportedLocalesOf(locales, options)`
- `Intl.Collator.prototype.compare`
- `Intl.Collator.prototype.resolvedOptions()`

Required internal behavior:

- `usage`: `"sort"` and `"search"`
- `locale` resolution with the `co`, `kn`, and `kf` Unicode extension keys
- `collation`: requested/default collation type, exposed as `"default"` when no explicit type resolves
- `numeric`: numeric collation via `kn` / `options.numeric`
- `caseFirst`: `"upper"`, `"lower"`, `"false"` via `kf` / `options.caseFirst`
- `sensitivity`: `"base"`, `"accent"`, `"case"`, `"variant"`
- `ignorePunctuation`
- Bound compare function caching

Primary spec references:

- [Intl.Collator constructor](https://tc39.es/ecma402/#sec-intl.collator)
- [Initialize Collator options and locale data](https://tc39.es/ecma402/#sec-intl.collator)
- [CompareStrings](https://tc39.es/ecma402/#sec-comparestrings)
- [Resolved Collator options](https://tc39.es/ecma402/#table-intl-collator-resolvedoptions)

## Data Sources

### Required

| Source | Why we need it | How to consume |
| ------ | -------------- | -------------- |
| CLDR common `common/uca/FractionalUCA_SHORT.txt` or `allkeys_CLDR_SHORT.txt` | Root CLDR collation element table. This is the base table for untailored collation and all locale tailorings. | Add a pinned CLDR common archive in Bazel, matching the repo's CLDR version. Prefer the `_SHORT` file for generator input. |
| CLDR common `common/collation/*.xml` | Locale-specific collation tailorings, collation types (`standard`, `search`, `phonebook`, `stroke`, `pinyin`, etc.), aliases, and default settings. | Parse XML during codegen. Do not parse XML at runtime. |
| `cldr-bcp47/bcp47/collation.json` | BCP 47 collation keyword metadata: valid `co` values, aliases, deprecations, and `Intl.supportedValuesOf("collation")` alignment. | Reuse the existing `cldr-bcp47` dependency already consumed by `intl-supportedvaluesof`. |
| Unicode decimal digit data | Needed for `numeric: true` / `kn=true` comparison of decimal digit runs across numbering systems. | Reuse the existing Unicode generated digit mapping from `@formatjs_generated/unicode/ecma402-abstract/digit-mapping.js` where possible. |
| Unicode normalization | UCA assumes canonical-equivalent input compares correctly. | Use `String.prototype.normalize("NFD")` in runtime when the generated collation settings require normalization. Document that environments without `normalize` need a separate dependency or reduced support. |

### Test Data

| Source | Why we need it |
| ------ | -------------- |
| CLDR common `common/uca/CollationTest_CLDR_NON_IGNORABLE_SHORT.txt` | Root non-ignorable conformance smoke tests. |
| CLDR common `common/uca/CollationTest_CLDR_SHIFTED_SHORT.txt` | Root shifted/ignore-punctuation conformance smoke tests. |
| Test262 `intl402/Collator` | ECMA-402 constructor, option, `resolvedOptions`, and compare behavior. |
| ICU reference snapshots | Locale-tailoring spot checks for languages with important tailorings: `de-u-co-phonebk`, `sv`, `da`, `es`, `zh-u-co-pinyin`, `zh-u-co-stroke`, `ja`, `ko`, `fr`, `th`, `tr`, `lt`. |

## Why CLDR Common, Not CLDR JSON

The repo currently consumes CLDR through npm packages such as `cldr-core`, `cldr-bcp47`, `cldr-numbers-full`, and `cldr-misc-full`. The current CLDR JSON package list does not include a `cldr-collation-full` package. Collation tailorings live in CLDR's LDML/XML data under `common/collation`, and root UCA data lives under `common/uca`.

So the Collator pipeline should add a pinned CLDR common archive or CLDR source-tree archive to Bazel, then extract only:

- `common/uca/*_SHORT.txt`
- `common/collation/*.xml`
- optionally `common/supplemental/supplementalMetadata.xml` / parent locale data if locale inheritance cannot be derived from existing `cldr-core`

## Preprocessing Strategy

### Stage 1: Parse Root Collation Data

Generate a root collation table from CLDR root data:

1. Parse code point sequences and collation elements.
2. Store collation weights by level: primary, secondary, tertiary, quaternary/variable.
3. Build a longest-match trie for contractions and multi-code-point mappings.
4. Preserve expansions, where one input sequence maps to multiple collation elements.
5. Mark variable elements so `alternate=shifted` and `ignorePunctuation` can suppress or move them correctly.
6. Implement implicit weights for code points not explicitly present in the root table, especially Han/unassigned code points.

Preferred generated shape:

```typescript
export type CollationElement = readonly [
  primary: number,
  secondary: number,
  tertiary: number,
  flags: number,
]

export const rootTrie: PackedTrie
export const rootElements: readonly CollationElement[]
```

The runtime should never scan a flat root table. It should walk a trie and emit collation elements.

### Stage 2: Parse LDML Collation Tailorings

Parse each `common/collation/*.xml` file into locale collation records:

```typescript
type RawCollation = {
  locale: string
  type: string
  rules: string
  settings: CollationSettings
  alias?: string
}
```

The parser needs to understand at least:

- resets: `&`
- relations: `<`, `<<`, `<<<`, `=`
- before resets: `[before 1]`, `[before 2]`, `[before 3]`
- expansions: `/`
- prefixes/context: `|`
- imports: `[import und-u-co-emoji]`
- settings: `[strength]`, `[alternate]`, `[backwards 2]`, `[caseFirst]`, `[numericOrdering]`, `[normalization]`, `[reorder]`
- XML aliases between locales/types

This parser should live under `packages/intl-collator/scripts/`, not in `ecma402-abstract`, because it is build-time only. `scripts/` should also be its own Bazel package: keep parser sources and parser tests in `//packages/intl-collator/scripts:*` targets instead of adding them to the parent runtime package target.

Use a real XML parser, currently `fast-xml-parser`, for the LDML XML layer. The rule grammar inside `<cr>` is not XML and can stay as a purpose-built parser, but any regexes in that parser should be module-level constants rather than recreated inside hot loops.

### Stage 3: Compile Tailorings Against Root

For each locale/type:

1. Resolve locale inheritance and collation type fallback.
2. Start from the root order plus inherited parent tailoring.
3. Apply LDML rules into a mutable order graph.
4. Allocate synthetic weights in gaps between existing root weights.
5. Emit only the delta from root:
   - added contractions
   - added expansions
   - replaced weights
   - settings overrides
   - alias target

Generated locale data should be compact:

```typescript
export default {
  locale: "de",
  collations: {
    default: "standard",
    standard: {settings, trieDelta, elementsDelta},
    phonebook: {settings, trieDelta, elementsDelta},
    search: {settings, trieDelta, elementsDelta},
  },
}
```

Do not duplicate the root trie in every locale file.

### Stage 4: Runtime Sort Key Generation

Runtime comparison should be:

1. Convert input with `String(x)`.
2. Normalize if required by settings.
3. Tokenize via longest-match trie.
4. Emit collation elements, including expansions and context-sensitive mappings.
5. If `numeric` is true, detect decimal digit runs and emit numeric primary weights.
6. Build or stream-compare level keys according to the resolved sensitivity:
   - `base`: primary
   - `accent`: primary + secondary
   - `case`: primary + case level / case tertiary handling
   - `variant`: primary + secondary + tertiary
7. Apply settings:
   - `caseFirst`: reorder case weights at case/tertiary level
   - `ignorePunctuation`: use shifted alternate handling for variable punctuation
   - French backwards secondary when `[backwards 2]` applies
8. Return `-1`, `0`, or `1`.

Prefer streaming level comparison over allocating full sort keys for every compare call. Add an internal `getSortKey()` helper only for tests and debugging.

## Package Architecture

### Files

```text
packages/intl-collator/
  index.ts
  polyfill.ts
  polyfill-force.ts
  should-polyfill.ts
  core.ts
  compare.ts
  sort-key.ts
  get_internal_slots.ts
  types.ts
  scripts/
    parse-uca.ts
    parse-ldml-collation.ts
    compile-collations.ts
    cldr-raw.ts
    locale-data.ts
  tests/
    index.test.ts
    compare.test.ts
    options.test.ts
    conformance-root.test.ts
```

### Generated Data

Use a hybrid data-loading model:

- Static root data in `@formatjs_generated/cldr.collation/root.js`
- Static metadata in `@formatjs_generated/cldr.collation/meta.js`
- Per-locale tree-shakeable files under `packages/intl-collator/locale-data/{locale}.js`

This keeps the base algorithm usable without loading every locale tailoring and matches the existing dynamic-locale pattern for large data polyfills.

### Public Loading API

Match the other polyfills:

```typescript
Intl.Collator.__addLocaleData(localeData)
```

Also support buffered locale data:

```typescript
globalThis.__FORMATJS_COLLATOR_DATA__
```

## Build Plan

1. Add `@formatjs/intl-collator` package skeleton.
2. Add CLDR common archive inputs to Bazel, pinned to the same CLDR family as the repo's npm CLDR dependencies.
3. Add generated package `@formatjs_generated/cldr.collation` for root data and metadata.
4. Add `cldr-raw` generation for per-locale collation deltas.
5. Add `locale-data` generation for tree-shakeable locale registration files.
6. Add `supported-locales` generation for Collator.
7. Add package build, `no_internal_imports_test`, and `package_exports_test`.
8. Add docs entry and website polyfill docs.

## Implementation Milestones

### Milestone 1: Root Sort MVP

- Root CLDR table only.
- `usage: "sort"` only.
- `sensitivity: "base" | "accent" | "variant"`.
- No locale tailorings yet.
- Tests: root CLDR non-ignorable short conformance, basic Test262 constructor/resolvedOptions.

### Milestone 2: Options

- `numeric`
- `caseFirst`
- `ignorePunctuation`
- `usage: "search"` default sensitivity plumbing
- Tests for each option against native ICU in Node where stable.

### Milestone 3: Locale Tailorings

- Parse and compile `standard` tailorings.
- Add locale-data loading.
- Cover high-signal locales: German phonebook, Swedish, Danish, Spanish traditional, Turkish, Lithuanian, French backwards secondary.

### Milestone 4: Collation Types

- Resolve `co` extension and `options.collation`.
- Add non-default types: `phonebk`, `dict`, `trad`, `pinyin`, `stroke`, `emoji`, `eor` where CLDR provides them.
- Align supported collation values with `intl-supportedvaluesof`.

### Milestone 5: Search

- Use `search` tailorings when available.
- Implement locale default search sensitivity.
- Add tests that compare search equivalence behavior separately from sort ordering.

### Milestone 6: Conformance and Size Work

- Add Test262 Collator shard.
- Add CLDR root short conformance tests.
- Add a small ICU snapshot suite for selected locales/types.
- Measure root data and top locale-data sizes.
- Tune packing format before publishing.

## Risks and Open Questions

- **Tailoring compiler complexity**: LDML collation rules are a small language. The first production risk is rule parsing and weight allocation, not the ECMA-402 wrapper.
- **Bundle size**: Root collation data is large. The generated format must be trie-based and delta-based from the start.
- **Search semantics**: `usage: "search"` is not just a sort with a different default sensitivity for all locales. CLDR `search` tailorings need to be represented separately.
- **Normalization**: Runtime normalization is required for correctness in some locales. Decide whether `String.prototype.normalize` is a hard dependency.
- **Implicit weights**: CJK/unassigned code points cannot rely only on explicit table entries.
- **Parity target**: Native engines use ICU, but exact output can vary by ICU/CLDR version. Tests should pin to the CLDR version used by our generator, not whatever Node happens to ship.

## Recommendation

Build this as a data compiler first, not a runtime-first polyfill. The runtime should consume a compact precompiled collation model:

- root trie + root element table
- per-locale/type deltas
- settings metadata

The first PR should not try to support all locale tailorings. It should land the package skeleton, root data generator, root sort-key runtime, and root conformance tests. Once the root model is stable, locale tailorings become incremental data/compiler work instead of rewrites to the comparison engine.
