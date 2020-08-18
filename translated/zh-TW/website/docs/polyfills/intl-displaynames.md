---
id: intl-displaynames
title: Intl.DisplayNames
---

A polyfill for [`Intl.DisplayNames`](https://tc39.es/proposal-intl-displaynames).

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-displaynames.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-displaynames) ![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-displaynames)

## Installation

```
npm install @formatjs/intl-displaynames
```

## Requirements

If you're supporting IE11-, this requires [`Intl.getCanonicalLocales`](intl-getcanonicallocales.md).

## Features

Everything in <https://github.com/tc39/proposal-intl-displaynames>.

## Usage

### Simple

```tsx
import '@formatjs/intl-displaynames/polyfill'
import '@formatjs/intl-displaynames/locale-data/en' // locale-data for en
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-displaynames/should-polyfill'
function polyfill(locale: string): Promise<any> {
  // This platform already supports Intl.PluralRules
  if (!shouldPolyfill()) {
    return Promise.resolve()
  }
  const polyfills = [import('@formatjs/intl-displaynames/polyfill')]
  switch (locale) {
    default:
      polyfills.push(import('@formatjs/intl-displaynames/locale-data/en'))
      break
    case 'fr':
      polyfills.push(import('@formatjs/intl-displaynames/locale-data/fr'))
      break
  }
  return Promise.all(polyfills)
}
```
