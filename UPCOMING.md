# Upcoming Improvements

## High Impact, High Feasibility

### 1. Vue `$t` Helper (Pinned Issue #3444, open 4+ years)
- Strong community demand for concise `$fm`, `$fn`, `$fd` helpers

## Medium Impact, Strategic

### 2. MessageFormat 2.0 (`Intl.MessageFormat` Polyfill)
- TC39 proposal progressing. Being the reference polyfill for MF2 would be a major strategic win.

### 3. `decimal.js` Bundle Size in `ecma402-abstract`
- 127KB dependency flowing into every polyfill. Evaluate if a lighter approach (native `BigInt`, lazy loading) is possible.

### 4. Rust CLI: Vue/GTS Extraction
- TS CLI has extractors for Vue, Handlebars, GlimmerJS that the Rust CLI lacks. Full parity would let us deprecate the TS CLI.

### 5. Framework Integrations: Svelte, Solid
- Only React and Vue have first-party integrations. Lingui already supports Svelte. Thin wrappers around `@formatjs/intl` core would be straightforward.
