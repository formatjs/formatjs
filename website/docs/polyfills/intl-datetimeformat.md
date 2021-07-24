---
id: intl-datetimeformat
title: Intl.DateTimeFormat (ESNext)
---

A spec-compliant polyfill for Intl.DateTimeFormat fully tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-datetimeformat.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-datetimeformat)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-datetimeformat)

:::caution
Right now we only support Gregorian calendar in this polyfill. Therefore we recommend setting `calendar: 'gregory'` in your options to be safe.
:::

:::caution
Right now this polyfill supports daylight transition until 2038 due to [Year 2038 problem](https://en.wikipedia.org/wiki/Year_2038_problem).
:::

## Features

- [dateStyle/timeStyle](https://github.com/tc39/proposal-intl-datetime-style)
- [formatRange](https://github.com/tc39/proposal-intl-DateTimeFormat-formatRange)

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
npm i @formatjs/intl-datetimeformat
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add @formatjs/intl-datetimeformat
```

</TabItem>
</Tabs>

## Requirements

This package requires the following capabilities:

- [`Intl.getCanonicalLocales`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/getCanonicalLocales) or [polyfill](intl-getcanonicallocales.md)
- [`Intl.Locale`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale) or [polyfill](intl-locale.md).
- [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat) or [polyfill](intl-numberformat.md).

## Usage

### Via polyfill.io

You can use [polyfill.io URL Builder](https://polyfill.io/v3/url-builder/) to create a polyfill script tag for `Intl.DateTimeFormat`. By default the created URL does not come with any locale data. In order to add locale data, append `Intl.DateTimeFormat.~locale.<locale>`, as well as locale data for any required polyfills, to your list of features. For example:

```html
<!-- Polyfill Intl.DateTimeFormat, its dependencies & `en` locale data -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=Intl.DateTimeFormat,Intl.DateTimeFormat.~locale.en,Intl.NumberFormat.~locale.en"></script>
```

### Simple

```tsx
import '@formatjs/intl-datetimeformat/polyfill'
import '@formatjs/intl-datetimeformat/locale-data/en' // locale-data for en
import '@formatjs/intl-datetimeformat/add-all-tz' // Add ALL tz data
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-datetimeformat/should-polyfill'
async function polyfill(locale: string) {
  if (!shouldPolyfill(locale)) {
    return
  }
  // Load the polyfill 1st BEFORE loading data
  await import('@formatjs/intl-datetimeformat/polyfill')

  // Parallelize CLDR data loading
  const dataPolyfills = [import('@formatjs/intl-datetimeformat/add-all-tz')]

  switch (locale) {
    default:
      dataPolyfills.push(import('@formatjs/intl-datetimeformat/locale-data/en'))
      break
    case 'fr':
      dataPolyfills.push(import('@formatjs/intl-datetimeformat/locale-data/fr'))
      break
  }
  await Promise.all(dataPolyfills)
}
```

### Adding IANA Timezone Database

We provide 2 pre-processed IANA Timezone:

#### Full: contains ALL Timezone from IANA database

```tsx
import '@formatjs/intl-datetimeformat/polyfill'
import '@formatjs/intl-datetimeformat/add-all-tz'
```

#### Golden: contains popular set of timezones from IANA database

```tsx
import '@formatjs/intl-datetimeformat/polyfill'
import '@formatjs/intl-datetimeformat/add-golden-tz'
```

### Default Timezone

Since JS Engines do not expose default timezone, there's currently no way for us to detect local timezone that a browser is in. Therefore, the default timezone in this polyfill is `UTC`.

You can change this by either calling `__setDefaultTimeZone` or always explicitly pass in `timeZone` option for accurate date time calculation.

Since `__setDefaultTimeZone` is not in the spec, you should make sure to check for its existence before calling it & after tz data has been loaded, e.g:

```tsx
import '@formatjs/intl-datetimeformat/polyfill'
import '@formatjs/intl-datetimeformat/add-all-tz.js'

if ('__setDefaultTimeZone' in Intl.DateTimeFormat) {
  Intl.DateTimeFormat.__setDefaultTimeZone('America/Los_Angeles')
}
```

## Tests

This library is fully [test262](https://github.com/tc39/test262/tree/master/test/intl402/DateTimeFormat)-compliant.
