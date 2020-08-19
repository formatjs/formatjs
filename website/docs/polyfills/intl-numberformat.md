---
id: intl-numberformat
title: Intl.NumberFormat (ES2020)
---

A polyfill for ES2020 [`Intl.NumberFormat`][numberformat] and [`Number.prototype.toLocaleString`][tolocalestring].

[numberformat]: https://tc39.es/ecma402/#numberformat-objects
[tolocalestring]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-numberformat.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-numberformat)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-numberformat)

## Installation

```
npm install @formatjs/intl-numberformat
```

## Requirements

This package requires the following capabilities:

1. [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules)

2. If you're supporting IE11-, this requires [`Intl.getCanonicalLocales`](intl-getcanonicallocales.md).

## Features

Everything in the ES2020 Internationalization API spec (https://tc39.es/ecma402).

## Usage

### Simple

```tsx
import '@formatjs/intl-numberformat/polyfill'
import '@formatjs/intl-numberformat/locale-data/en' // locale-data for en
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-numberformat/should-polyfill'
async function polyfill(locale: string) {
  if (shouldPolyfill()) {
    // Load the polyfill 1st BEFORE loading data
    await import('@formatjs/intl-numberformat/polyfill')
  }
  if (Intl.NumberFormat.polyfilled) {
    switch (locale) {
      default:
        await import('@formatjs/intl-numberformat/locale-data/en')
        break
      case 'fr':
        await import('@formatjs/intl-numberformat/locale-data/fr')
        break
    }
  }
}
```

## Supported Units

### Simple Units

Currently [the spec](https://tc39.es/ecma402/#sec-issanctionedsimpleunitidentifier) defines a list of sanctioned units as below.

```tsx
type Unit =
  | 'acre'
  | 'bit'
  | 'byte'
  | 'celsius'
  | 'centimeter'
  | 'day'
  | 'degree'
  | 'fahrenheit'
  | 'fluid-ounce'
  | 'foot'
  | 'gallon'
  | 'gigabit'
  | 'gigabyte'
  | 'gram'
  | 'hectare'
  | 'hour'
  | 'inch'
  | 'kilobit'
  | 'kilobyte'
  | 'kilogram'
  | 'kilometer'
  | 'liter'
  | 'megabit'
  | 'megabyte'
  | 'meter'
  | 'mile'
  | 'mile-scandinavian'
  | 'millimeter'
  | 'milliliter'
  | 'millisecond'
  | 'minute'
  | 'month'
  | 'ounce'
  | 'percent'
  | 'petabyte'
  | 'pound'
  | 'second'
  | 'stone'
  | 'terabit'
  | 'terabyte'
  | 'week'
  | 'yard'
  | 'year'
```

### Compound Units

You can specify `X-per-Y` unit, where `X` and `Y` are sactioned simple units (e.g. `kilometer-per-hour`).
The library will choose the best-fit localized pattern to format this compound unit.
