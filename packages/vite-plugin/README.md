# @formatjs/vite-plugin

Vite plugin for FormatJS AST transformations. Replicates the functionality of `babel-plugin-formatjs` and `@formatjs/ts-transformer` using `oxc-parser` + `magic-string` for fast, compiler-agnostic builds.

## Installation

```bash
npm install @formatjs/vite-plugin --save-dev
```

## Usage

```ts
// vite.config.ts
import {defineConfig} from 'vite'
import formatjs from '@formatjs/vite-plugin'

export default defineConfig({
  plugins: [
    formatjs({
      idInterpolationPattern: '[sha512:contenthash:base64:6]',
      ast: true,
    }),
  ],
})
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
