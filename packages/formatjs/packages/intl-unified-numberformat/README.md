# `intl-unified-numberformat`

A ponyfill/polyfill for [`intl-unified-numberformat`](https://github.com/tc39/proposal-unified-intl-numberformat). This wraps `Intl.NumberFormat` and has the exact same APIs.

## Installation

```
npm install @formatjs/intl-unified-numberformat
```

## Requirements

This package requires the following capabilities:

- [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules)

# Features

Everything in the https://github.com/tc39/proposal-unified-intl-numberformat proposal with the caveats below.

## Caveats

1. `compact` notation is currently buggy in certain locales with special compact rules (such as `zh-Hant` or `Somali`) See https://github.com/tc39/proposal-unified-intl-numberformat/issues/26 for more details.

# Usage

To use the ponyfill, import it along with its data:

```tsx
import {UnifiedNumberFormat} from '@formatjs/intl-unified-numberformat';
UnifiedNumberFormat.__addLocaleData(
  require('@formatjs/intl-unified-numberformat/dist/locale-data/zh.json') // locale-data for zh
);
UnifiedNumberFormat.__addLocaleData(
  require('@formatjs/intl-unified-numberformat/dist/locale-data/en.json') // locale-data for en
);

new UnifiedNumberFormat('zh', {
  style: 'unit',
  unit: 'bit',
  unitDisplay: 'long',
}).format(1000); // 1,000比特
```

To use this as a polyfill, override `Intl.NumberFormat` as below:

```tsx
import '@formatjs/intl-unified-numberformat/polyfill';
if (typeof Intl.NumberFormat.__addLocaleData === 'function') {
  Intl.NumberFormat.__addLocaleData(
    require('@formatjs/intl-unified-numberformat/dist/locale-data/zh.json') // locale-data for zh
  );
  Intl.NumberFormat.__addLocaleData(
    require('@formatjs/intl-unified-numberformat/dist/locale-data/en.json') // locale-data for en
  );
}

new Intl.NumberFormat('zh', {
  style: 'unit',
  unit: 'bit',
  unitDisplay: 'long',
}).format(1000); // 1,000比特

new Intl.NumberFormat('en-US', {
  notation: 'engineering',
}).format(987654321); // 987.7E6

new Intl.NumberFormat('zh', {
  style: 'currency',
  currency: 'EUR',
  currencySign: 'accounting',
}).format(-100); // (€100.00)
```

## Supported Units

Currently [intl-unified-numberformat](https://tc39.es/proposal-unified-intl-numberformat/section6/locales-currencies-tz_diff_out.html#sec-issanctionedsimpleunitidentifier) has a list of sanctioned units as below

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
