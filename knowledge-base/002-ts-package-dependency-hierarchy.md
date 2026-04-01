# TypeScript Package Dependency Hierarchy

## Dependency Layers

Packages are organized by their depth in the internal dependency graph. Each layer only depends on packages in layers below it.

### Layer 0 — Leaf Packages (no internal deps)

| Package                              | Purpose                                                              |
| ------------------------------------ | -------------------------------------------------------------------- |
| `@formatjs/bigdecimal`               | BigInt-backed decimal arithmetic for ECMA-402 precision requirements |
| `@formatjs/fast-memoize`             | Memoization utility (fork of fast-memoize)                           |
| `@formatjs/intl-getcanonicallocales` | Polyfill for `Intl.getCanonicalLocales`                              |
| `@formatjs/ecma376`                  | ECMA-376 number format generation                                    |

### Layer 1 — Core Infrastructure

| Package                            | Internal Dependencies                        |
| ---------------------------------- | -------------------------------------------- |
| `@formatjs/intl-localematcher`     | fast-memoize                                 |
| `@formatjs/ecma402-abstract`       | bigdecimal, fast-memoize, intl-localematcher |
| `@formatjs/intl-supportedvaluesof` | ecma402-abstract, fast-memoize               |

### Layer 2 — Parsers & Polyfills

**Parsers:**

| Package                              | Internal Dependencies                 |
| ------------------------------------ | ------------------------------------- |
| `@formatjs/icu-skeleton-parser`      | ecma402-abstract                      |
| `@formatjs/icu-messageformat-parser` | ecma402-abstract, icu-skeleton-parser |

**Intl Polyfills** (all depend on `ecma402-abstract` + `intl-localematcher`):

| Package                             | Extra Internal Dependencies                        |
| ----------------------------------- | -------------------------------------------------- |
| `@formatjs/intl-numberformat`       | + bigdecimal                                       |
| `@formatjs/intl-datetimeformat`     | + bigdecimal                                       |
| `@formatjs/intl-pluralrules`        | + bigdecimal                                       |
| `@formatjs/intl-displaynames`       |                                                    |
| `@formatjs/intl-listformat`         |                                                    |
| `@formatjs/intl-relativetimeformat` |                                                    |
| `@formatjs/intl-durationformat`     |                                                    |
| `@formatjs/intl-segmenter`          |                                                    |
| `@formatjs/intl-locale`             | + intl-getcanonicallocales, intl-supportedvaluesof |

**Utilities:**

| Package           | Internal Dependencies |
| ----------------- | --------------------- |
| `@formatjs/utils` | fast-memoize          |

### Layer 3 — Formatting & Build Tools

| Package                    | Internal Dependencies                                                        |
| -------------------------- | ---------------------------------------------------------------------------- |
| `intl-messageformat`       | ecma402-abstract, fast-memoize, icu-messageformat-parser                     |
| `@formatjs/intl`           | ecma402-abstract, fast-memoize, icu-messageformat-parser, intl-messageformat |
| `@formatjs/ts-transformer` | icu-messageformat-parser                                                     |
| `babel-plugin-formatjs`    | icu-messageformat-parser, ts-transformer                                     |
| `eslint-plugin-formatjs`   | icu-messageformat-parser, ts-transformer                                     |
| `@formatjs/unplugin`       | icu-messageformat-parser, ts-transformer                                     |
| `@formatjs/cli-lib`        | icu-messageformat-parser, icu-skeleton-parser, ts-transformer                |

### Layer 4 — Framework Integrations & CLI

| Package                 | Internal Dependencies                                                | Peer Dependencies                |
| ----------------------- | -------------------------------------------------------------------- | -------------------------------- |
| `react-intl`            | ecma402-abstract, icu-messageformat-parser, intl, intl-messageformat | React 19                         |
| `vue-intl`              | icu-messageformat-parser, intl                                       | Vue 3.5+                         |
| `@formatjs/svelte-intl` | icu-messageformat-parser, intl                                       | Svelte 5                         |
| `@formatjs/editor`      | icu-messageformat-parser, react-intl                                 | React 19                         |
| `@formatjs/cli`         | cli-lib                                                              | (optional: Vue, Svelte, Glimmer) |

## Most Depended-On Packages

Ranked by number of direct internal dependents:

1. **`@formatjs/ecma402-abstract`** — 20+ packages (all polyfills, formatters, integrations)
2. **`@formatjs/icu-messageformat-parser`** — 10+ packages (formatters, tools, integrations)
3. **`@formatjs/intl-localematcher`** — 9 packages (all major polyfills)
4. **`@formatjs/fast-memoize`** — 5 packages
5. **`@formatjs/ts-transformer`** — 4 packages (babel-plugin, eslint-plugin, cli-lib, unplugin)

## Visual Dependency Graph

```
Layer 0:  bigdecimal   fast-memoize   intl-getcanonicallocales   ecma376
              |            |  |
Layer 1:     ecma402-abstract  intl-localematcher   intl-supportedvaluesof
              |         |            |
Layer 2:  icu-skeleton-parser    [all 9 polyfills]     intl-locale   utils
              |
          icu-messageformat-parser
              |
Layer 3:  intl-messageformat   ts-transformer   cli-lib   babel-plugin   unplugin   eslint-plugin
              |                     |
          @formatjs/intl            |
              |                     |
Layer 4:  react-intl   vue-intl   svelte-intl   editor   cli
```
