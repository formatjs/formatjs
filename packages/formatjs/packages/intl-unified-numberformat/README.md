# `intl-unified-numberformat`

A ponyfill for [`intl-unified-numberformat`](https://github.com/tc39/proposal-unified-intl-numberformat). This wraps `Intl.NumberFormat` and has the exact same APIs.

## Installation

```
npm install @formatjs/intl-unified-numberformat
```

## Requirements

This package requires the following capabilities:

- [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules)

# Usage

To use the ponyfill, import it along with its data:

```tsx
import {UnifiedNumberFormat} from '@formatjs/intl-unified-numberformat';
UnifiedNumberFormat.__addUnitLocaleData(
  require('../dist/locale-data/zh.json') // locale-data for zh
);
UnifiedNumberFormat.__addUnitLocaleData(
  require('../dist/locale-data/en.json') // locale-data for en
);

new UnifiedNumberFormat('zh', {
  style: 'unit',
  unit: 'bit',
  unitDisplay: 'long',
}).format(1000); // 1,000比特
```

To use this as a polyfill, override `Intl.NumberFormat` as below:

```tsx
import {UnifiedNumberFormat} from '@formatjs/intl-unified-numberformat';
UnifiedNumberFormat.__addUnitLocaleData(
  require('../dist/locale-data/zh.json') // locale-data for zh
);
UnifiedNumberFormat.__addUnitLocaleData(
  require('../dist/locale-data/en.json') // locale-data for en
);

Intl.NumberFormat = UnifiedNumberFormat; // Override native NumberFormat

new Intl.NumberFormat('zh', {
  style: 'unit',
  unit: 'bit',
  unitDisplay: 'long',
}).format(1000); // 1,000比特
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
