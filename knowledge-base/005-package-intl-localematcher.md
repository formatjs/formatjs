# @formatjs/intl-localematcher

## Purpose

Implements UTS #35 locale matching algorithms: Lookup matcher and BestFit matcher. Used by all Intl polyfills for `ResolveLocale`.

## ECMA-402 Conformance

- **Section 9.1** — `ResolveLocale` abstract operation
- **UTS #35 Section 4.4** — Language Matching (CLDR distance-based algorithm)

## Design Decisions

### Three-Tier Optimization (Issue #4936)

Critical performance fix for React Native/Hermes environments where 700+ auto-loaded locales caused 610ms delays. Reduced to ~1.4ms (439x faster).

- **Tier 1:** O(1) exact match using Set lookup
- **Tier 2:** Locale maximization + progressive subtag removal fallback (e.g., `zh-Hant-TW` -> `zh-Hant` -> `zh`)
- **Tier 3:** Full UTS #35 CLDR distance calculation with memoization (only reached for complex cases)

### Memoization

Uses `@formatjs/fast-memoize` to cache distance calculation results. The CLDR distance table is expensive to traverse, so caching is essential for repeated calls with similar locales.

### Generated Data

- `regions.generated.ts` — CLDR territory containment hierarchy (used for macro-region matching, e.g., `en-001` matches `en-GB`)

## Dependencies

`@formatjs/fast-memoize`
