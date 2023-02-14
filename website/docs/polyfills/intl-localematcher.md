---
id: intl-localematcher
title: Intl.LocaleMatcher
---

A spec-compliant ponyfill for [Intl.LocaleMatcher](https://github.com/tc39/proposal-intl-localematcher). Since this is only stage-1 this package is a ponyfill instead of polyfill.

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-localematcher.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-localematcher)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-localematcher)

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
npm i @formatjs/intl-localematcher
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add @formatjs/intl-localematcher
```

</TabItem>
</Tabs>

## Requirements

- [`Intl.getCanonicalLocales`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/getCanonicalLocales) or [polyfill](intl-getcanonicallocales.md)
- [`Intl.Locale`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale) or [polyfill](intl-locale.md)

## Usage

### Simple

```tsx
import {match} from '@formatjs/intl-localematcher'

match(
  ['fr-XX', 'en'],
  ['fr', 'en'],
  'en'
) // 'fr'

match(
  ['zh'],
  ['fr', 'en'],
  'en'
) // 'en'
```
