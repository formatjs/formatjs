# @formatjs/unplugin

Universal build plugin for FormatJS AST transformations. Supports Vite, Webpack, Rollup, esbuild, and Rspack with one codebase.

Replicates the functionality of `babel-plugin-formatjs` and `@formatjs/ts-transformer` using `oxc-parser` + `magic-string` for fast, compiler-agnostic builds.

## Installation

```bash
npm install @formatjs/unplugin --save-dev
```

## Usage

### Vite

```ts
// vite.config.ts
import {defineConfig} from 'vite'
import formatjs from '@formatjs/unplugin/vite'

export default defineConfig({
  plugins: [
    formatjs({
      idInterpolationPattern: '[sha512:contenthash:base64:6]',
      ast: true,
    }),
  ],
})
```

### Webpack

```js
// webpack.config.js
const formatjs = require('@formatjs/unplugin/webpack').default

module.exports = {
  plugins: [
    formatjs({
      idInterpolationPattern: '[sha512:contenthash:base64:6]',
      ast: true,
    }),
  ],
}
```

### Rollup

```js
// rollup.config.js
import formatjs from '@formatjs/unplugin/rollup'

export default {
  plugins: [
    formatjs({
      idInterpolationPattern: '[sha512:contenthash:base64:6]',
      ast: true,
    }),
  ],
}
```

### esbuild

```js
import esbuild from 'esbuild'
import formatjs from '@formatjs/unplugin/esbuild'

esbuild.build({
  plugins: [
    formatjs({
      idInterpolationPattern: '[sha512:contenthash:base64:6]',
      ast: true,
    }),
  ],
})
```

### Rspack

```js
// rspack.config.js
const formatjs = require('@formatjs/unplugin/rspack').default

module.exports = {
  plugins: [
    formatjs({
      idInterpolationPattern: '[sha512:contenthash:base64:6]',
      ast: true,
    }),
  ],
}
```

## Options

| Option                     | Type       | Default                         | Description                             |
| -------------------------- | ---------- | ------------------------------- | --------------------------------------- |
| `idInterpolationPattern`   | `string`   | `[sha512:contenthash:base64:6]` | Pattern for generating message IDs      |
| `overrideIdFn`             | `function` | —                               | Custom function to generate message IDs |
| `removeDefaultMessage`     | `boolean`  | `false`                         | Remove `defaultMessage` from output     |
| `additionalComponentNames` | `string[]` | `[]`                            | Extra JSX component names to process    |
| `additionalFunctionNames`  | `string[]` | `[]`                            | Extra function names to process         |
| `ast`                      | `boolean`  | `false`                         | Pre-parse `defaultMessage` into AST     |
| `preserveWhitespace`       | `boolean`  | `false`                         | Keep original whitespace in messages    |
