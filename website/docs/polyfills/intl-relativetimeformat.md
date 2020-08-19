---
id: intl-relativetimeformat
title: Intl.RelativeTimeFormat
---

A spec-compliant polyfill for Intl.RelativeTimeFormat fully tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-relativetimeformat.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-relativetimeformat)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-relativetimeformat)

## Installation

```
npm install @formatjs/intl-relativetimeformat
```

## Requirements

This package requires the following capabilities:

1. [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules)

2. If you're supporting IE11-, this requires [`Intl.getCanonicalLocales`](intl-getcanonicallocales.md).

3. If you need `formatToParts` and have to support IE11- or Node 10-, you'd need to polyfill using [`@formatjs/intl-numberformat`](intl-numberformat.md).

## Usage

### Simple

```tsx
import '@formatjs/intl-relativetimeformat/polyfill'
import '@formatjs/intl-relativetimeformat/locale-data/en' // locale-data for en
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-relativetimeformat/should-polyfill'
async function polyfill(locale: string) {
  // This platform already supports Intl.RelativeTimeFormat
  if (!shouldPolyfill()) {
    return
  }
  // Load the polyfill 1st BEFORE loading data
  await import('@formatjs/intl-relativetimeformat/polyfill')
  switch (locale) {
    default:
      await import('@formatjs/intl-relativetimeformat/locale-data/en')
      break
    case 'fr':
      await import('@formatjs/intl-relativetimeformat/locale-data/fr')
      break
  }
}
```

## Tests

This library is fully [test262](https://github.com/tc39/test262/tree/master/test/intl402/RelativeTimeFormat)-compliant.
