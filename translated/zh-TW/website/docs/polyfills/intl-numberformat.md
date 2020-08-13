---
id: intl-numberformat
title: Intl.NumberFormat (ES2020)
---

A polyfill for ES2020 [`Intl.NumberFormat`][numberformat] and [`Number.prototype.toLocaleString`][tolocalestring].

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-numberformat.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-numberformat) ![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-numberformat)

## Installation

```
npm install @formatjs/intl-numberformat
```

## Requirements

This package requires the following capabilities:

1. [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules)

2. If you're supporting IE11-, this requires [`Intl.getCanonicalLocales`](intl-getcanonicallocales.md).

# Features

Everything in the ES2020 Internationalization API spec (https://tc39.es/ecma402).

# Usage

To use this as a polyfill, override `Intl.NumberFormat` as below:

```tsx
import '@formatjs/intl-numberformat/polyfill';
import '@formatjs/intl-numberformat/locale-data/zh.js'; // locale-data for zh
import '@formatjs/intl-numberformat/locale-data/en.js'; // locale-data for en

new Intl.NumberFormat('zh', {
  style: 'unit',
  unit: 'kilometer-per-hour',
  unitDisplay: 'long',
}).format(1000); // 每小时1,000公里

new Intl.NumberFormat('en-US', {
  notation: 'engineering',
}).format(987654321); // 987.7E6

new Intl.NumberFormat('zh', {
  style: 'currency',
  currency: 'EUR',
  currencySign: 'accounting',
}).format(-100); // (€100.00)

// `Number.prototype.toLocaleString` is also polyfilled.
(987654321).toLocaleString('en-US', {
  notation: 'engineering',
}); // 987.7E6
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
  | 'year';
```

### Compound Units

You can specify `X-per-Y` unit, where `X` and `Y` are sactioned simple units (e.g. `kilometer-per-hour`). The library will choose the best-fit localized pattern to format this compound unit.

[numberformat]: https://tc39.es/ecma402/#numberformat-objects
[tolocalestring]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
