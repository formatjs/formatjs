# Developer Tooling Packages

## @formatjs/ts-transformer

**Purpose:** TypeScript compiler transformer for compile-time message extraction and ID generation.

**How it works:**

- Hooks into the TypeScript compilation pipeline as a transformer plugin
- Intercepts `defineMessage(s)`, `formatMessage`, and `<FormattedMessage>` calls
- Generates deterministic message IDs from `defaultMessage` + `description` + `meaning`
- ID interpolation via `interpolateName` (webpack loader-utils compatible pattern: `[sha512:contenthash:base64:6]`)
- Can strip `defaultMessage` from production builds to reduce bundle size

**Used by:** babel-plugin-formatjs, eslint-plugin-formatjs, unplugin

## babel-plugin-formatjs

**Purpose:** Babel plugin providing the same functionality as ts-transformer for Babel-based builds.

**How it works:**

- Babel AST visitor detects `FormattedMessage`, `formatMessage`, `defineMessage(s)` calls
- Extracts `defaultMessage` and generates IDs
- Unwraps TypeScript `as`, `satisfies`, non-null and type assertions, Flow casts, and parentheses before evaluating descriptor values and recognizing inline descriptors or `defineMessages` maps/entries
- Rewrites strings inside wrappers; AST compilation replaces the whole message value
- Wrapper regressions live in `tests/typescript-wrappers.test.ts`; `//packages/babel-plugin-formatjs/conformance-tests:conformance-tests_test` compares extracted messages and generated IDs with unplugin and the native CLI (required, never skipped)
- Options: `removeDefaultMessage`, `idInterpolationPattern`, `overrideIdFn`, `ast` (pre-compile messages)

**Dependencies:** @babel/core, @babel/traverse, @babel/types, ts-transformer, icu-messageformat-parser

## @formatjs/unplugin

**Purpose:** Universal build plugin supporting Vite, Webpack, Rollup, esbuild, and Rspack.

**Design decisions:**

- Uses `oxc-parser` for AST analysis (faster than Babel/TypeScript parser)
- Uses `magic-string` for source map-preserving transformations
- Single codebase for all bundlers via the `unplugin` framework
- Replicates babel-plugin-formatjs + ts-transformer functionality without Babel/TS dependency
- Unwraps parentheses and TypeScript wrappers around descriptors and declaration maps
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

`blocklist-elements` accepts blocked element names or objects containing `type`
and an `allow` exception. Exceptions match a `variable` and, when configured,
the exact selector `options`. The `recommended` and `strict` configs block
`selectordinal` and restrict `select` to `gender` with `male`, `female`, and
`other` options.

Message call recognition matches unplugin by callee name, regardless of receiver:
`formatMessage`, `$formatMessage`, `$t`, `defineMessage(s)`, and configured
`additionalFunctionNames` work as direct calls or methods, including optional
calls. `util.ts` unwraps TypeScript assertions, `satisfies`, and non-null
expressions around descriptors, `defineMessages` maps, and map entries. It keeps
the inner object/property nodes for diagnostics and fixes. Descriptor keys may
be identifiers or quoted strings. `excludeMessageDeclCalls` still excludes both
direct and namespaced declarations. Cross-tool regression tests live in
`tests/message-recognition.test.ts`. Native CLI/unplugin conformance also covers
receiver names, configured functions, descriptor keys, and wrapper combinations
in `packages/unplugin/conformance-tests/cli-unplugin-conformance.test.ts`.

**Peer dep:** `eslint@9 || 10`

## @formatjs/cli-lib

**Purpose:** Core library powering both the Node.js CLI and providing programmatic APIs.

**Key APIs:**

- `extract(files, options)` — Extract messages from source files
- `compile(messages, options)` — Compile translations to ICU format
- `compileFolder(inputDir, outputDir, options)` — Batch compilation

**Extractor support:**

- JavaScript, TypeScript, JSX, and TSX source use OXC, Rust uses syn, and Python
  uses Ruff through the native `formatjs_cli_napi` extractor.
- Vue, Svelte, Handlebars, and GTS/Glimmer keep small JavaScript container
  adapters. Embedded script fragments are sent to the same native extractor.
- Native JS/TS extraction unwraps parentheses and TypeScript wrappers around
  descriptors and declaration maps, and accepts quoted descriptor keys.
- Programmatic options such as callbacks, custom ID functions, pragma metadata,
  source locations, stdin, and custom formatters are applied around structured
  native results.

`cli-lib` has no runtime dependency on TypeScript or `@formatjs/ts-transformer`.
The native binding is required for extraction and compilation.

**Pseudo-locale generation:** Creates fake translations for testing (XxLs, XxAc, XxHa, EnXa, EnXb)

**Engines:** Node >= 20.12.0

**Optional peer deps:** Vue, Svelte, @glimmer/syntax, content-tag

## @formatjs/cli

**Purpose:** Command-line interface wrapping cli-lib.

**Commands:**

- `formatjs extract` — Extract messages from source files
- `formatjs compile` — Compile translation files
- `formatjs compile-folder` — Batch compile a directory

The Rust CLI (`crates/formatjs_cli/`) is a 20.90x faster drop-in replacement in the checked-in extraction benchmark, with parallelized catalog parsing for large compile and structural verify workloads.

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
