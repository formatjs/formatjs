# @formatjs/intl-getcanonicallocales

**ECMA-402 Section 8.2.1** — `Intl.getCanonicalLocales`

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
