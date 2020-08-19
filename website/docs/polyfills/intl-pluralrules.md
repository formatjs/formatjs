---
id: intl-pluralrules
title: Intl.PluralRules
---

A spec-compliant polyfill for [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules) fully tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-pluralrules.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-pluralrules)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-pluralrules)

## Installation

```
npm install @formatjs/intl-pluralrules
```

## Requirements

If you're supporting IE11-, this requires [`Intl.getCanonicalLocales`](intl-getcanonicallocales.md).

## Usage

### Simple

```tsx
import '@formatjs/intl-pluralrules/polyfill'
import '@formatjs/intl-pluralrules/locale-data/en' // locale-data for en
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-pluralrules/should-polyfill'
async function polyfill(locale: string) {
  if (shouldPolyfill()) {
    // Load the polyfill 1st BEFORE loading data
    await import('@formatjs/intl-pluralrules/polyfill')
  }

  if (Intl.PluralRules.polyfilled) {
    switch (locale) {
      default:
        await import('@formatjs/intl-pluralrules/locale-data/en')
        break
      case 'fr':
        await import('@formatjs/intl-pluralrules/locale-data/fr')
        break
    }
  }
}
```
