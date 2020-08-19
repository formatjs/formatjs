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
async function polyfill(locale: string) {
  // This platform already supports Intl.ListFormat
  if (!shouldPolyfill()) {
    return
  }
  // Load the polyfill 1st BEFORE loading data
  await import('@formatjs/intl-listformat/polyfill')
  switch (locale) {
    default:
      await import('@formatjs/intl-listformat/locale-data/en')
      break

    case 'fr':
      await import('@formatjs/intl-listformat/locale-data/fr')
      break
  }
}
```

## Tests

This library is fully [test262](https://github.com/tc39/test262/tree/master/test/intl402/ListFormat)-compliant.
