# @formatjs/intl-getcanonicallocales

## Rust and Hermes

Inline Rust and JavaScript comments map ECMA-402 algorithm steps to their
implementation using pinned specification source lines.

`crates/intl_getcanonicallocales` provides a Rust canonicalizer backed by ICU4X.
It validates ECMA-402 language tags before canonicalization. CLDR BCP 47
extension and subdivision aliases supplement ICU4X; regenerate the checked-in
Rust table with `bazel run //crates/intl_getcanonicallocales:aliases`.

The default `compiled_data` feature preserves the convenience functions and
native C ABI. Rust callers can disable defaults and construct a reusable
`Canonicalizer::try_new_with_provider(&provider)` from the same ICU buffer
provider used by MessageFormat. Construction loads global canonicalization
payloads once; subsequent calls use the retained payloads without consulting
the provider. Reconstruct the canonicalizer to adopt replacement base data.
The small generated CLDR alias tables remain compiled into the crate.

Canonicalization data is global metadata, not one pack per requested locale.
Locale-specific formatter packs remain a separate provider concern. The
`provider_test` target compiles this crate without its `compiled_data` feature;
the shared Bazel dependency graph can still enable ICU compiled data for other
consumers, so this target alone is not a binary-size measurement.

`native/hermes` exposes the Rust library through a C ABI and a C++ JSI
installer. The JS wrapper owns observable locale-list coercion, property
access, exceptions, and ordered de-duplication. Rust owns tag validation and
canonicalization. Install once per runtime before application scripts.
The adapter uses public JSI APIs, with no Hermes VM changes.

The pinned Hermes VM uses the native Bazel module from
[formatjs/hermes](https://github.com/formatjs/hermes), with platform Intl disabled.
`tools/hermes-test262` runs every pinned upstream
`Intl.getCanonicalLocales` test in fresh Hermes processes; the Locale-object
case additionally loads the existing JS `Intl.Locale` polyfill.

```sh
bazel test -c opt //crates/intl_getcanonicallocales:intl_getcanonicallocales_test \
  //benchmarks/intl-canonicalization:conformance_test \
  //tools/hermes-test262:getcanonicallocales_test
bazel run -c opt //benchmarks/intl-canonicalization:benchmark
```

The benchmark compares complete JS and Rust-backed API calls in the same
Hermes process, including coercion and JSI overhead. It checks results before
timing, alternates implementation order, and reports median throughput plus
raw samples. Timings exclude startup and do not establish Android/iOS results.
The Rust crate is not published; React Native package and mobile artifact
distribution are separate work.

**ECMA-402 Section 8.3.1** — `Intl.getCanonicalLocales`

## Purpose

Polyfill for `Intl.getCanonicalLocales()` — canonicalizes locale identifier strings using CLDR alias and likely subtag data. Leaf package with no internal dependencies.

## Dependencies

None (leaf package).

## CLDR Data Pipeline

### Sources

| CLDR File                                   | Data Used                                        |
| ------------------------------------------- | ------------------------------------------------ |
| `cldr-core/supplemental/aliases.json`       | Language, territory, script, and variant aliases |
| `cldr-core/supplemental/likelySubtags.json` | Likely subtag expansion data                     |

### Extraction Scripts (`scripts/`)

| Script              | Output                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `aliases.ts`        | `src/aliases.generated.ts` — 4 lookup maps: languageAlias, territoryAlias, scriptAlias, variantAlias |
| `likely-subtags.ts` | `src/likelySubtags.generated.ts` — Locale → maximized locale mapping                                 |

### Build Pipeline

Two independent `generate_src_file` targets:

```
aliases.ts       → src/aliases.generated.ts (~7700 lines)
likely-subtags.ts → src/likelySubtags.generated.ts
```

### Generated Data Examples

```typescript
// aliases.generated.ts
export const languageAlias: Record<string, string> = {
  "iw": "he",        // Hebrew
  "in": "id",        // Indonesian
  "ji": "yi",        // Yiddish
  ...
}
export const territoryAlias: Record<string, string> = {
  "BU": "MM",        // Burma → Myanmar
  "CS": "RS",        // Serbia and Montenegro → Serbia
  ...
}

// likelySubtags.generated.ts
export const likelySubtags: Record<string, string> = {
  "en": "en-Latn-US",
  "zh": "zh-Hans-CN",
  "zh-Hant": "zh-Hant-TW",
  ...
}
```

### Runtime Loading

- Static imports in `index.ts`
- Used by `parseUnicodeLanguageId()` for locale string parsing and canonicalization
- No dynamic loading needed — data is small enough to bundle directly

## Locale-list coercion

`getCanonicalLocales` rejects `null`, coerces array-like lengths once with
`ToLength`, and accepts string-coercible object entries. Native Locale values
and values from the installed Locale polyfill use their intrinsic locale tag,
ignoring overridden instance properties. Objects that merely expose `language`
and `baseName` are treated as ordinary array-like inputs.

Locale identifier casing is normalized before CLDR alias lookup, including
language, script, region, and variant subtags.

Unicode and transformed extensions use CLDR BCP 47 aliases. Transformed
extensions accept a language, fields, or both, and retain `true` field values.

The `rg` and `sd` Unicode keys resolve CLDR subdivision aliases. Territory
replacements receive the required `zzzz` suffix; multiple replacements use the first.

CLDR compound aliases remove matched subtags, preserve unrelated fields, and
apply the most specific rule first, including language-independent variants.

Canonicalization creates list elements directly without calling an overridden
`Array.prototype.push`, including while parsing and emitting extensions.

Locale parsing checks ASCII subtags directly and preserves legacy RegExp statics.
Extension singleton matching is case-insensitive, including duplicate detection.
