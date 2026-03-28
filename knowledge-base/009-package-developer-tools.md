# Developer Tooling Packages

## @formatjs/ts-transformer

**Purpose:** TypeScript compiler transformer for compile-time message extraction and ID generation.

**How it works:**

- Hooks into the TypeScript compilation pipeline as a transformer plugin
- Intercepts `defineMessage(s)`, `formatMessage`, and `<FormattedMessage>` calls
- Generates deterministic message IDs from `defaultMessage` + `description` + `meaning`
- ID interpolation via `interpolateName` (webpack loader-utils compatible pattern: `[sha512:contenthash:base64:6]`)
- Can strip `defaultMessage` from production builds to reduce bundle size

**Used by:** babel-plugin-formatjs, eslint-plugin-formatjs, cli-lib, unplugin

## babel-plugin-formatjs

**Purpose:** Babel plugin providing the same functionality as ts-transformer for Babel-based builds.

**How it works:**

- Babel AST visitor detects `FormattedMessage`, `formatMessage`, `defineMessage(s)` calls
- Extracts `defaultMessage` and generates IDs
- Options: `removeDefaultMessage`, `idInterpolationPattern`, `overrideIdFn`, `ast` (pre-compile messages)

**Dependencies:** @babel/core, @babel/traverse, @babel/types, ts-transformer, icu-messageformat-parser

## @formatjs/unplugin

**Purpose:** Universal build plugin supporting Vite, Webpack, Rollup, esbuild, and Rspack.

**Design decisions:**

- Uses `oxc-parser` for AST analysis (faster than Babel/TypeScript parser)
- Uses `magic-string` for source map-preserving transformations
- Single codebase for all bundlers via the `unplugin` framework
- Replicates babel-plugin-formatjs + ts-transformer functionality without Babel/TS dependency
- Separate entry points per bundler: `vite.ts`, `webpack.ts`, `rollup.ts`, `esbuild.ts`, `rspack.ts`

**Options:** `idInterpolationPattern`, `overrideIdFn`, `removeDefaultMessage`, `ast`, `preserveWhitespace`

**Peer deps (all optional):** vite, webpack, rollup, esbuild, @rspack/core

## eslint-plugin-formatjs

**Purpose:** ESLint rules for i18n best practices.

**Rules include:**

- Enforce message descriptions
- Prohibit certain ICU MessageFormat features
- Validate message syntax
- Enforce consistent ID patterns

**Peer dep:** `eslint@9 || 10`

## @formatjs/cli-lib

**Purpose:** Core library powering both the Node.js CLI and providing programmatic APIs.

**Key APIs:**

- `extract(files, options)` — Extract messages from source files
- `compile(messages, options)` — Compile translations to ICU format
- `compileFolder(inputDir, outputDir, options)` — Batch compilation

**Extractor support:**

- React (JSX/TSX) — default
- Vue SFC (`vue_extractor.ts`)
- Svelte (`svelte_extractor.ts`)
- Handlebars (`hbs_extractor.ts`)
- GTS/Glimmer (`gts_extractor.ts`)

**Pseudo-locale generation:** Creates fake translations for testing (XxLs, XxAc, XxHa, EnXa, EnXb)

**Engines:** Node >= 20.12.0

**Optional peer deps:** Vue, Svelte, @glimmer/syntax, content-tag

## @formatjs/cli

**Purpose:** Command-line interface wrapping cli-lib.

**Commands:**

- `formatjs extract` — Extract messages from source files
- `formatjs compile` — Compile translation files
- `formatjs compile-folder` — Batch compile a directory

The Rust CLI (`crates/formatjs_cli/`) is a 17x faster drop-in replacement with identical command-line interface and 100% conformance (60/60 integration tests passing).

## Utility Packages

### @formatjs/bigdecimal

BigInt-backed decimal arithmetic. Lightweight replacement for decimal.js, providing the arbitrary precision required by ECMA-402 NumberFormat for correct rounding behavior. Representation: `mantissa * 10^exponent` with special flags for NaN, Infinity, -0. No runtime dependencies.

### @formatjs/fast-memoize

Fork of the `fast-memoize` library. Used throughout for caching formatter instances and locale matching results.

### @formatjs/icu-skeleton-parser

Parses ICU number/datetime skeleton syntax (the `::` notation in MessageFormat) into `Intl.NumberFormatOptions` / `Intl.DateTimeFormatOptions`. Exports: `parseNumberSkeleton`, `parseDateTimeSkeleton`.

### @formatjs/utils

Collection of i18n utility functions: `canonicalizeCountryCode`, `defaultCurrency`, `defaultLocale`, `defaultTimezone`, `currencyMinorScale`.

### @formatjs/ecma376

ECMA-376 (Office Open XML) number format generation. Used for spreadsheet number formatting compatibility.
