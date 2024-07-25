---
id: intl-numberformat
title: Intl.NumberFormat (ESNext)
---

A polyfill for ESNext [`Intl.NumberFormat`][numberformat] and [`Number.prototype.toLocaleString`][tolocalestring].

[numberformat]: https://tc39.es/ecma402/#numberformat-objects
[tolocalestring]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-numberformat.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-numberformat)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-numberformat)

## Installation

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'

<Tabs
groupId="npm"
defaultValue="npm"
values={[
{label: 'npm', value: 'npm'},
{label: 'yarn', value: 'yarn'},
]}>
<TabItem value="npm">

```sh
npm i @formatjs/intl-numberformat
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add @formatjs/intl-numberformat
```

</TabItem>
</Tabs>

## Requirements

This package requires the following capabilities:

- [`Intl.getCanonicalLocales`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/getCanonicalLocales) or [polyfill](intl-getcanonicallocales.md)
- [`Intl.Locale`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale) or [polyfill](intl-locale.md).
- [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules) or [polyfill](intl-pluralrules.md).

## Features

Everything in the ES2020 Internationalization API spec (https://tc39.es/ecma402).

## Usage

### Via polyfill-fastly.io

You can use [polyfill-fastly.io URL Builder](https://polyfill-fastly.io/) to create a polyfill script tag for `Intl.NumberFormat`. By default the created URL does not come with any locale data. In order to add locale data, append `Intl.NumberFormat.~locale.<locale>`, as well as locale data for any required polyfills, to your list of features. For example:

```html
<!-- Polyfill Intl.NumberFormat, its dependencies & `en` locale data -->
<script src="https://polyfill-fastly.io/v3/polyfill.min.js?features=Intl.NumberFormat,Intl.NumberFormat.~locale.en"></script>
```

Or if `Intl.PluralRules` needs to be polyfilled as well:

```html
<!-- Polyfill Intl.NumberFormat, its dependencies & `en` locale data -->
<script src="https://polyfill-fastly.io/v3/polyfill.min.js?features=Intl.NumberFormat,Intl.NumberFormat.~locale.en,Intl.PluralRules.~locale.en"></script>
```

### Simple

```tsx
import '@formatjs/intl-numberformat/polyfill'
import '@formatjs/intl-numberformat/locale-data/en' // locale-data for en
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-numberformat/should-polyfill'
async function polyfill(locale: string) {
  const unsupportedLocale = shouldPolyfill(locale)
  // This locale is supported
  if (!unsupportedLocale) {
    return
  }
  // Load the polyfill 1st BEFORE loading data
  await import('@formatjs/intl-numberformat/polyfill-force')
  await import(`@formatjs/intl-numberformat/locale-data/${locale}`)
}
```

## Supported Units

### Simple Units

Currently, [the spec](https://tc39.es/ecma402/#sec-issanctionedsimpleunitidentifier) defines a list of sanctioned units as below.

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

You can specify `X-per-Y` unit, where `X` and `Y` are sanctioned simple units (e.g. `kilometer-per-hour`).
The library will choose the best-fit localized pattern to format this compound unit.
