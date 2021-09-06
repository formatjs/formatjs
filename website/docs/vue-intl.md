---
id: vue-intl
title: Vue Plugin for formatjs
---

This library contains our plugin for Vue.

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
npm i -S vue-intl
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add vue-intl
```

</TabItem>
</Tabs>

## Usage

Initialize `VueIntl` plugin with the same `IntlConfig` documented in [@formatjs/intl](./intl.md#IntlShape).

```tsx
import {createIntl} from 'vue-intl'

const app = createApp(App)
app.use(
  createIntl({
    locale: 'en',
    defaultLocale: 'en',
    messages: {
      foo: 'bar',
    },
  })
)
```

From there you can use our APIs in 2 ways:

### inject

By specifying `inject: {intl: intlKey}`, you can use the full `IntlFormatters` API documented in [@formatjs/intl](./intl.md#IntlShape).

Note: `intlKey` needs to be imported from `vue-intl`.

### Composition API

We also support Vue's [Composition API](https://composition-api.vuejs.org/) with `provideIntl` & `useIntl`.

```ts
import {createIntl} from '@formatjs/intl'
import {provideIntl, useIntl} from 'vue-intl'

const Ancestor = {
  setup() {
    provideIntl(
      createIntl({
        locale: 'en',
        defaultLocale: 'en',
        messages: {
          foo: 'Composed',
        },
      })
    )
  },
  render() {
    return h(Descendant)
  },
}

const Descendant = {
  setup() {
    const intl = useIntl()
    return () =>
      h(
        'p',
        {},
        intl.formatMessage({
          id: 'foo',
          defaultMessage: 'Hello',
        })
      )
  },
}
```

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

See [@formatjs/intl](./intl.md) for the full list of API signatures.

## Tooling

`formatjs` toolchain fully supports `vue`:

- [eslint-plugin-formatjs](./tooling/linter.md): This fully supports `.vue` and JS/TS.
- [@formatjs/cli](./tooling/cli.md): We now support extracting messages from `.vue` SFC files.
- [babel-plugin-formatjs](./tooling/babel-plugin.md): Compile messages during bundling for `babel`.
- [@formatjs/ts-transformer](./tooling/ts-transformer.md): Compile messages during bundling for `TypeScript`.

## Caveats

### Using ICU in Vue SFC

Since `}}` & `{{` are special tokens in `.vue` `<template>`, this can cause potential conflict with ICU MessageFormat syntax, e.g:

```html {4}
<template>
  <p>
    {{ $formatMessage({ defaultMessage: '{count, selectordinal, offset:1 one {#}
    other {# more}}', }) }}
  </p>
</template>
```

Notice the `{# more}}` where it ends with `}}`. This will cause parsing issue in your `vue` template. In order to work around this issue, we recommend using space to turn `}}` into `} }`.

```vue {6}
<template>
  <p>
    {{
      $formatMessage({
        defaultMessage:
          '{count, selectordinal, offset:1 one {#} other {# more} }',
      })
    }}
  </p>
</template>
```
