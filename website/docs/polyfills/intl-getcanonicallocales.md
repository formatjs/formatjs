---
id: intl-getcanonicallocales
title: Intl.getCanonicalLocales
---

A spec-compliant polyfill/ponyfill for `Intl.getCanonicalLocales` tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-getcanonicallocales.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-getcanonicallocales)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-getcanonicallocales)

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
npm i @formatjs/intl-getcanonicallocales
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add @formatjs/intl-getcanonicallocales
```

</TabItem>
</Tabs>

## Usage

### Via polyfill.io

You can use [polyfill.io URL Builder](https://polyfill.io/v3/url-builder/) to create a polyfill script tag for `Intl.GetCanonicalLocales`. For example:

```html
<!-- Polyfill Intl.GetCanonicalLocales & its dependencies -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=Intl.GetCanonicalLocales"></script>
```

### Simple

```tsx
import '@formatjs/intl-getcanonicallocales/polyfill'
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-getcanonicallocales/should-polyfill'
async function polyfill() {
  // This platform already supports Intl.getCanonicalLocales
  if (shouldPolyfill()) {
    await import('@formatjs/intl-getcanonicallocales/polyfill')
  }
  // Alternatively, force the polyfill regardless of support
  await import('@formatjs/intl-getcanonicallocales/polyfill-force')
}
```

## Tests

This library is [test262](https://github.com/tc39/test262/tree/master/test/intl402/Intl/getCanonicalLocales)-compliant.
