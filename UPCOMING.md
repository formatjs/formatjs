# Upcoming Improvements

## High Impact, High Feasibility

### 1. Vite Plugin Adoption (689/week vs 276K for babel-plugin)
- Consider an `unplugin`-based approach to cover Webpack, Vite, Rollup, esbuild, Rspack with one codebase
- Better docs with Next.js + Vite, Remix, SvelteKit examples

### 2. Vue `$t` Helper (Pinned Issue #3444, open 4+ years)
- Strong community demand for concise `$fm`, `$fn`, `$fd` helpers

### 3. Drop `tslib` Across All 27 Packages
- Modern TS 5.x can emit helpers inline. Removes a runtime dep from 9.3M weekly `intl-messageformat` installs.

## Medium Impact, Strategic

### 4. MessageFormat 2.0 (`Intl.MessageFormat` Polyfill)
- TC39 proposal progressing. Being the reference polyfill for MF2 would be a major strategic win.

### 5. `decimal.js` Bundle Size in `ecma402-abstract`
- 127KB dependency flowing into every polyfill. Evaluate if a lighter approach (native `BigInt`, lazy loading) is possible.

### 6. Rust CLI: Vue/GTS Extraction
- TS CLI has extractors for Vue, Handlebars, GlimmerJS that the Rust CLI lacks. Full parity would let us deprecate the TS CLI.

### 7. Framework Integrations: Svelte, Solid
- Only React and Vue have first-party integrations. Lingui already supports Svelte. Thin wrappers around `@formatjs/intl` core would be straightforward.

## Maintenance / Cleanup

### 8. Documentation Gaps
No guides for: Next.js App Router + RSC, React Native + Hermes, migration from i18next/Lingui, performance tuning. The SWC plugin docs are a 1-line stub.
