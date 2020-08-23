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

If you're supporting IE11-, this requires [`Intl.getCanonicalLocales`](intl-getcanonicallocales.md).

## Usage

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
}
```

## Tests

This library is [test262](https://github.com/tc39/test262/tree/master/test/intl402/Locale)-compliant.
