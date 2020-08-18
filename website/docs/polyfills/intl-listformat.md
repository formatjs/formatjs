---
id: intl-listformat
title: Intl.ListFormat
---

A spec-compliant polyfill for Intl.ListFormat fully tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-listformat.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-listformat)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-listformat)

## Installation

```
npm install @formatjs/intl-listformat
```

## Requirements

If you're supporting IE11-, this requires [`Intl.getCanonicalLocales`](intl-getcanonicallocales.md).

## Usage

### Simple

```tsx
import '@formatjs/intl-listformat/polyfill'
import '@formatjs/intl-listformat/locale-data/en' // locale-data for en
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-listformat/should-polyfill'
function polyfill(locale: string): Promise<any> {
  // This platform already supports Intl.PluralRules
  if (!shouldPolyfill()) {
    return Promise.resolve()
  }
  const polyfills = [import('@formatjs/intl-listformat/polyfill')]
  switch (locale) {
    default:
      polyfills.push(import('@formatjs/intl-listformat/locale-data/en'))
      break
    case 'fr':
      polyfills.push(import('@formatjs/intl-listformat/locale-data/fr'))
      break
  }
  return Promise.all(polyfills)
}
```

## Tests

This library is fully [test262](https://github.com/tc39/test262/tree/master/test/intl402/ListFormat)-compliant.
