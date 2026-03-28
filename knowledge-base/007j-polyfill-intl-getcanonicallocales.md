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
