---
id: intl-displaynames
title: Intl.DisplayNames
---

A polyfill for [`Intl.DisplayNames`](https://tc39.es/proposal-intl-displaynames).

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-displaynames.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-displaynames)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-displaynames)

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
npm i @formatjs/intl-displaynames
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add @formatjs/intl-displaynames
```

</TabItem>
</Tabs>

## Requirements

- [`Intl.getCanonicalLocales`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/getCanonicalLocales) or [polyfill](intl-getcanonicallocales.md)
- [`Intl.Locale`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale) or [polyfill](intl-locale.md).

## Features

Everything in <https://github.com/tc39/proposal-intl-displaynames>.

## Usage

### Via polyfill.io

You can use [polyfill.io URL Builder](https://polyfill.io/v3/url-builder/) to create a polyfill script tag for `Intl.DisplayNames`. By default the created URL does not come with any locale data. In order to add locale data, append `Intl.DisplayNames.~locale.<locale>` to your list of features. For example:

```html
<!-- Polyfill Intl.DisplayNames, its dependencies & `en` locale data -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=Intl.DisplayNames,Intl.DisplayNames.~locale.en"></script>
```

### Simple

```tsx
import '@formatjs/intl-displaynames/polyfill'
import '@formatjs/intl-displaynames/locale-data/en' // locale-data for en
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-displaynames/should-polyfill'
async function polyfill(locale: string) {
  const unsupportedLocale = shouldPolyfill(locale)
  // This locale is supported
  if (!unsupportedLocale) {
    return
  }
  // Load the polyfill 1st BEFORE loading data
  await import('@formatjs/intl-displaynames/polyfill-force')
  await import(`@formatjs/intl-displaynames/locale-data/${locale}`)
}
```
