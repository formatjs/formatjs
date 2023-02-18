---
id: intl-segmenter
title: Intl.Segmenter
---

A polyfill for [`Intl.Segmenter`](https://tc39.es/proposal-intl-segmenter).

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-segmenter.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-segmenter)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-segmenter)

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
npm i @formatjs/intl-segmenter
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add @formatjs/intl-segmenter
```

</TabItem>
</Tabs>

## Features

Everything in <https://tc39.es/proposal-intl-segmenter>.

## Usage

### Via polyfill.io

You can use [polyfill.io URL Builder](https://polyfill.io/v3/url-builder/) to create a polyfill script tag for `Intl.Segmenter`.
For example:

```html
<!-- Polyfill Intl.Segmenter-->
<script src="https://polyfill.io/v3/polyfill.min.js?features=Intl.Segmenter"></script>
```

### Simple

```tsx
import '@formatjs/intl-segmenter/polyfill'
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-segmenter/should-polyfill'
async function polyfill(locale: string) {
  if (shouldPolyfill()) {
    await import('@formatjs/intl-segmenter/polyfill-force')
  }
}
```
