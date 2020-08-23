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

If you're supporting IE11-, this requires [`Intl.getCanonicalLocales`](intl-getcanonicallocales.md).

## Features

Everything in <https://github.com/tc39/proposal-intl-displaynames>.

## Usage

### Simple

```tsx
import '@formatjs/intl-displaynames/polyfill'
import '@formatjs/intl-displaynames/locale-data/en' // locale-data for en
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-displaynames/should-polyfill'
async function polyfill(locale: string) {
  if (shouldPolyfill()) {
    // Load the polyfill 1st BEFORE loading data
    await import('@formatjs/intl-displaynames/polyfill')
  }

  if (Intl.DisplayNames.polyfilled) {
    switch (locale) {
      default:
        await import('@formatjs/intl-displaynames/locale-data/en')
        break
      case 'fr':
        await import('@formatjs/intl-displaynames/locale-data/fr')
        break
    }
  }
}
```
