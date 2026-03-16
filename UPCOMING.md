# Upcoming Improvements

## High Impact, High Feasibility

### 1. Vue `$t` Helper (Pinned Issue #3444, open 4+ years)
- Strong community demand for concise `$fm`, `$fn`, `$fd` helpers

### 2. Drop `tslib` Across All 27 Packages
- Modern TS 5.x can emit helpers inline. Removes a runtime dep from 9.3M weekly `intl-messageformat` installs.

## Medium Impact, Strategic

### 3. MessageFormat 2.0 (`Intl.MessageFormat` Polyfill)
- TC39 proposal progressing. Being the reference polyfill for MF2 would be a major strategic win.

### 4. `decimal.js` Bundle Size in `ecma402-abstract`
- 127KB dependency flowing into every polyfill. Evaluate if a lighter approach (native `BigInt`, lazy loading) is possible.

### 5. Rust CLI: Vue/GTS Extraction
- TS CLI has extractors for Vue, Handlebars, GlimmerJS that the Rust CLI lacks. Full parity would let us deprecate the TS CLI.

### 6. Framework Integrations: Svelte, Solid
- Only React and Vue have first-party integrations. Lingui already supports Svelte. Thin wrappers around `@formatjs/intl` core would be straightforward.
