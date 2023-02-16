---
id: intl-locale
title: Intl.Locale
---

A spec-compliant polyfill/ponyfill for Intl.Locale tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-locale.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-locale)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-locale)

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
npm i @formatjs/intl-locale
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add @formatjs/intl-locale
```

</TabItem>
</Tabs>

## Requirements

- [`Intl.getCanonicalLocales`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/getCanonicalLocales) or [polyfill](intl-getcanonicallocales.md)

## Usage

### Via polyfill.io

You can use [polyfill.io URL Builder](https://polyfill.io/v3/url-builder/) to create a polyfill script tag for `Intl.Locale`. For example:

```html
<!-- Polyfill Intl.Locale & its dependencies -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=Intl.Locale"></script>
```

### Simple

```tsx
import '@formatjs/intl-locale/polyfill'
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-locale/should-polyfill'
async function polyfill() {
  // This platform already supports Intl.Locale
  if (shouldPolyfill()) {
    await import('@formatjs/intl-locale/polyfill')
  }
  // Alternatively, force the polyfill regardless of support
  await import('@formatjs/intl-locale/polyfill-force')
}
```

## Tests

This library is [test262](https://github.com/tc39/test262/tree/master/test/intl402/Locale)-compliant.
