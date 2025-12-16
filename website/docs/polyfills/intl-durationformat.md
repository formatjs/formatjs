---
id: intl-durationformat
title: Intl.DurationFormat
---

A spec-compliant polyfill for Intl.DurationFormat

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-durationformat.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-durationformat)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-durationformat)

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
npm i @formatjs/intl-durationformat
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add @formatjs/intl-durationformat
```

</TabItem>
</Tabs>

## Requirements

- [`Intl.ListFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat) or [polyfill](intl-listformat.md)
- [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) or [polyfill](intl-numberformat.md).

## Usage

### Simple

```tsx
import '@formatjs/intl-durationformat/polyfill.js'
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-durationformat/should-polyfill.js'
async function polyfill(locale: string) {
  const unsupportedLocale = shouldPolyfill(locale)
  // This locale is supported
  if (!unsupportedLocale) {
    return
  }
  // Load the polyfill 1st BEFORE loading data
  await import('@formatjs/intl-durationformat/polyfill-force.js')
}
```
