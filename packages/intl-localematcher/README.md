# Intl LocaleMatcher

We've migrated the docs to https://formatjs.github.io/docs/polyfills/intl-localematcher.

## Performance

This package implements a highly optimized three-tier locale matching algorithm that provides excellent performance even with large locale sets (700+ locales).

### Benchmark Results

Benchmarked with 725 CLDR locales on Node.js:

| Scenario                                                | Latency | Throughput | Relative Performance |
| ------------------------------------------------------- | ------- | ---------- | -------------------- |
| **Tier 1: Exact Match** (`en`)                          | 1.38ms  | 730 ops/s  | Baseline             |
| **Tier 2: 1-level Fallback** (`en-US` → `en`)           | 1.39ms  | 725 ops/s  | 1.01x slower         |
| **Tier 2: Maximized Match** (`zh-TW` → `zh-Hant`)       | 1.40ms  | 720 ops/s  | 1.02x slower         |
| **Tier 3: CLDR Distance** (`sr-Latn-BA` → `sr-Latn-BA`) | 1.38ms  | 730 ops/s  | 1.00x slower         |
| **Tier 3: Fuzzy Match** (`en-XZ` → `en`)                | 1.50ms  | 670 ops/s  | 1.09x slower         |

### Real-world Impact

The optimization in this package resolved [issue #4936](https://github.com/formatjs/formatjs/issues/4936), where `DurationFormat` instantiation was taking **610ms** on React Native/Hermes due to slow locale matching against 700+ auto-loaded locales.

**After optimization:**

- Common case (`en-US`): **1.39ms** per instantiation
- Chinese locales (`zh-TW`): **1.40ms** per instantiation
- Serbo-Croatian locales: **1.38ms** per instantiation

**Performance improvement: 439x faster** 🚀

### Three-Tier Optimization

The algorithm uses three tiers for maximum performance:

1. **Tier 1 (Exact Match)**: O(1) Set lookup for exact locale matches
2. **Tier 2 (Maximization + Fallback)**: Progressive subtag removal with locale maximization
3. **Tier 3 (CLDR Distance)**: Full UTS #35 Enhanced Language Matching with memoization

This design ensures that common cases (exact matches and simple fallbacks) are extremely fast, while complex scenarios (script/region matching, language distances) still perform well.
