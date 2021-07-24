---
id: intl-listformat
title: Intl.ListFormat
---

A spec-compliant polyfill for Intl.ListFormat fully tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-listformat.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-listformat)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-listformat)

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
npm i @formatjs/intl-listformat
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add @formatjs/intl-listformat
```

</TabItem>
</Tabs>

## Requirements

- [`Intl.getCanonicalLocales`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/getCanonicalLocales) or [polyfill](intl-getcanonicallocales.md)
- [`Intl.Locale`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale) or [polyfill](intl-locale.md).

## Usage

### Via polyfill.io

You can use [polyfill.io URL Builder](https://polyfill.io/v3/url-builder/) to create a polyfill script tag for `Intl.ListFormat`. By default the created URL does not come with any locale data. In order to add locale data, append `Intl.ListFormat.~locale.<locale>` to your list of features. For example:

```html
<!-- Polyfill Intl.ListFormat, its dependencies & `en` locale data -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=Intl.ListFormat,Intl.ListFormat.~locale.en"></script>
```

### Simple

```tsx
import '@formatjs/intl-listformat/polyfill'
import '@formatjs/intl-listformat/locale-data/en' // locale-data for en
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-listformat/should-polyfill'
async function polyfill(locale: string) {
  // This platform already supports Intl.ListFormat
  if (!shouldPolyfill(locale)) {
    return
  }
  // Load the polyfill 1st BEFORE loading data
  await import('@formatjs/intl-listformat/polyfill')

  switch (locale) {
    default:
      await import('@formatjs/intl-listformat/locale-data/en')
      break

    case 'fr':
      await import('@formatjs/intl-listformat/locale-data/fr')
      break
  }
}
```

## Tests

This library is fully [test262](https://github.com/tc39/test262/tree/master/test/intl402/ListFormat)-compliant.
