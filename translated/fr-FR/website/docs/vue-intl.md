---
id: vue-intl
title: Vue Plugin for formatjs
---

This library contains our plugin for Vue.

## Installation

import Tabs from '@theme/Tabs' import TabItem from '@theme/TabItem'

<Tabs
groupId="npm"
defaultValue="npm"
values={[
{label: 'npm', value: 'npm'},
{label: 'yarn', value: 'yarn'},
]}>
<TabItem value="npm">

```sh
npm i -S @formatjs/vue-intl
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add -S @formatjs/vue-intl
```

</TabItem>
</Tabs>

## Usage

Initialize `VueIntl` plugin with the same `IntlConfig` documented in [@formatjs/intl](./intl.md#IntlShape).

```tsx
import VueIntl from '@formatjs/vue-intl'

const app = createApp(App)
app.use(VueIntl, {
  locale: 'en',
  defaultLocale: 'en',
  messages: {
    foo: 'bar',
  },
})
```

From there you can use our APIs in 2 ways:

### inject

By specifying `inject: ['intl']`, you can use the full `IntlFormatters` API documented in [@formatjs/intl](./intl.md#IntlShape).

### Methods

You can also use our formatters in Vue template by prepending `$` like below:

```vue
<template>
  <p>{{ $formatNumber(3, {style: 'currency', currency: 'USD'}) }}</p>
</template>
```

We currently support:

- `$formatMessage`
- `$formatDate`
- `$formatTime`
- `$formatRelativeTime`
- `$formatTimeRange`
- `$formatDisplayName`
- `$formatList`
