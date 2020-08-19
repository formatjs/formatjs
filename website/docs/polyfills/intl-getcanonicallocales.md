---
id: intl-getcanonicallocales
title: Intl.getCanonicalLocales
---

A spec-compliant polyfill/ponyfill for `Intl.getCanonicalLocales` tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-getcanonicallocales.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-getcanonicallocales)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-getcanonicallocales)

## Installation

```
npm install @formatjs/intl-getcanonicallocales
```

## Usage

### Simple

```tsx
import '@formatjs/intl-getcanonicallocales/polyfill'
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-getcanonicallocales/should-polyfill'
async function polyfill() {
  // This platform already supports Intl.getCanonicalLocales
  if (shouldPolyfill()) {
    await import('@formatjs/intl-getcanonicallocales/polyfill')
  }
}
```

## Tests

This library is [test262](https://github.com/tc39/test262/tree/master/test/intl402/Intl/getCanonicalLocales)-compliant.
