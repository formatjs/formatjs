---
id: intl-locale
title: Intl.Locale
---

A spec-compliant polyfill/ponyfill for Intl.Locale tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-locale.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-locale) ![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-locale)

## Installation

```
npm install @formatjs/intl-locale
```

## Requirements

If you're supporting IE11-, this requires [`Intl.getCanonicalLocales`](intl-getcanonicallocales.md).

## Usage

### Simple

```tsx
import '@formatjs/intl-locale/polyfill'
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-locale/should-polyfill'
function polyfill(locale: string): Promise<any> {
  // This platform already supports Intl.PluralRules
  if (!shouldPolyfill()) {
    return Promise.resolve()
  }
  return import('@formatjs/intl-locale/polyfill')
}
```

## Tests

This library is [test262](https://github.com/tc39/test262/tree/master/test/intl402/Locale)-compliant.
