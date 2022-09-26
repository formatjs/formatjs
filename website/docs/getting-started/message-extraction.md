---
id: message-extraction
title: Message Extraction
---

Now that you've declared some messages, it's time to extract them.

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
npm i -D @formatjs/cli
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add -D @formatjs/cli
```

</TabItem>
</Tabs>

## Extraction

Add the following command to your `package.json` `scripts`:

```json
{
  "scripts": {
    "extract": "formatjs extract"
  }
}
```

and execute with `npm`:

<Tabs
groupId="npm"
defaultValue="npm"
values={[
{label: 'npm', value: 'npm'},
{label: 'yarn', value: 'yarn'},
]}>
<TabItem value="npm">

```sh
npm run extract -- 'src/**/*.ts*' --ignore='**/*.d.ts' --out-file lang/en.json --id-interpolation-pattern '[sha512:contenthash:base64:6]'
```

</TabItem>
<TabItem value="yarn">

```sh
yarn extract 'src/**/*.ts*' --ignore='**/*.d.ts' --out-file lang/en.json --id-interpolation-pattern '[sha512:contenthash:base64:6]'
```

</TabItem>
</Tabs>

:::caution ID Interpolation Pattern
Make sure this pattern matches `idInterpolationPattern` when you use `babel-plugin-formatjs` or `@formatjs/ts-transformer` in [Bundling with formatjs](https://formatjs.io/docs/guides/bundler-plugins) or you'll get a `MISSING_TRANSLATION` error.
:::

Given a file that has the following messages:

<Tabs
groupId="engine"
defaultValue="react"
values={[
{label: 'React', value: 'react'},
{label: 'Vue3', value: 'vue'},
]}>

<TabItem value="react">

```tsx
import * as React from 'react'
import {FormattedMessage, useIntl, injectIntl} from 'react-intl'

class PasswordChangeWithIntl extends React.Component {
  render() {
    const {intl} = this.props
    return (
      <li>
        <input
          placeholder={intl.formatMessage({
            defaultMessage: 'New Password',
            description: 'placeholder text',
          })}
        />
        <input
          placeholder={intl.formatMessage({
            id: 'explicit-id',
            defaultMessage: 'Confirm Password',
            description: 'placeholder text',
          })}
        />
      </li>
    )
  }
}

const PasswordChange = injectIntl(PasswordChangeWithIntl)

export function List(props) {
  const intl = useIntl()
  return (
    <section>
      <header>
        <FormattedMessage
          defaultMessage="Control Panel"
          description="title of control panel section"
        />
      </header>
      <ul>
        <li>
          <button>
            <FormattedMessage
              defaultMessage="Delete user {name}"
              description="Delete button"
              values={{
                name: props.name,
              }}
            />
          </button>
        </li>
        <PasswordChange />
      </ul>
    </section>
  )
}
```

</TabItem>

<TabItem value="vue">

```vue
<template>
  <section>
    <header>
      {{
        $formatMessage({
          defaultMessage: 'Control Panel',
          description: 'title of control panel section',
        })
      }}
    </header>
    <ul>
      <li>
        <button>
          {{
            $formatMessage(
              {
                defaultMessage: 'Delete user {name}',
                description: 'Delete button',
              },
              {
                name: props.name,
              }
            )
          }}
        </button>
      </li>
      <li>
        <input :placeholder="newPwdPlaceholder" />
        <input :placeholder="confirmPwdPlaceholder" />
      </li>
    </ul>
  </section>
</template>

<script>
export default {
  inject: ['intl'],
  props: ['name'],
  data() {
    return {
      name: this.name,
      newPwdPlaceholder: intl.formatMessage({
        defaultMessage: 'New Password',
        description: 'placeholder text',
      }),
      confirmPwdPlaceholder: intl.formatMessage({
        id: 'explicit-id',
        defaultMessage: 'Confirm Password',
        description: 'placeholder text',
      }),
    }
  },
}
</script>
```

</TabItem>
</Tabs>

running the above command will create a file called `lang/en.json`:

```json
{
  "hak27d": {
    "defaultMessage": "Control Panel",
    "description": "title of control panel section"
  },
  "haqsd": {
    "defaultMessage": "Delete user {name}",
    "description": "delete button"
  },
  "19hjs": {
    "defaultMessage": "New Password",
    "description": "placeholder text"
  },
  "explicit-id": {
    "defaultMessage": "Confirm Password",
    "description": "placeholder text"
  }
}
```

:::info Message ID
During extraction, we'll preserve explicit declared IDs and insert a hash as an ID for messages without. We recommend against explicit IDs since it can cause collision.
:::

## Automatic ID Generation

Since manual IDs are discouraged, we've provided a `babel` plugin and a `TypeScript` AST transformer that will automatically insert message IDs in your transpiled code. For more details please visit [Bundling with formatjs](https://formatjs.io/docs/guides/bundler-plugins).

## Translation Management System (TMS) Integration

The default format generated from `@formatjs/cli` might not work with the specific TMS/vendor you're working with. You can specify a custom formatter with `--format <formatFile>` that allows you to convert that format into something tailored to your TMS. For example:

If your vendor accepts the format like

```json
{
  "[id]": {
    "string": "[message]",
    "comment": "[description]"
  }
}
```

you can run

<Tabs
groupId="npm"
defaultValue="npm"
values={[
{label: 'npm', value: 'npm'},
{label: 'yarn', value: 'yarn'},
]}>
<TabItem value="npm">

```sh
npm run extract -- "src/**/*.{ts,tsx,vue}" --out-file lang/en.json --id-interpolation-pattern '[sha512:contenthash:base64:6]' --format formatter.js
```

</TabItem>
<TabItem value="yarn">

```sh
yarn extract "src/**/*.{ts,tsx,vue}" --out-file lang/en.json --id-interpolation-pattern '[sha512:contenthash:base64:6]' --format formatter.js
```

</TabItem>
</Tabs>

where `formatter.js` is:

```js
exports.format = function (msgs) {
  const results = {}
  for (const [id, msg] of Object.entries(msgs)) {
    results[id] = {
      string: msg.defaultMessage,
      comment: msg.description,
    }
  }
  return results
}
```

We also provide several [builtin formatters](../tooling/cli.md#builtin-formatters) to integrate with 3rd party TMSes so feel free to create PRs to add more.

| TMS                                                                                        | `--format`  |
| ------------------------------------------------------------------------------------------ | ----------- |
| [Crowdin Chrome JSON](https://support.crowdin.com/file-formats/chrome-json/)               | `crowdin`   |
| [Lingohub](https://lingohub.com/developers/resource-files/json-localization/)              | `simple`    |
| [Localize's Simple JSON](https://developers.localizejs.com/docs/simple-json-import-export) | `simple`    |
| [locize](https://docs.locize.com/integration/supported-formats#json-nested)                | `simple`    |
| [Lokalise Structured JSON](https://docs.lokalise.com/en/articles/3229161-structured-json)  | `lokalise`  |
| [Phrase](https://help.phrase.com/help/simple-json)                                         | `simple`    |
| [POEditor Key-Value JSON](https://poeditor.com/localization/files/key-value-json)          | `simple`    |
| [SimpleLocalize JSON](https://simplelocalize.io/docs/file-formats/simplelocalize-json/)    | `simple`    |
| [Smartling ICU JSON](https://help.smartling.com/hc/en-us/articles/360008000733-JSON)       | `smartling` |
| [Transifex's Structured JSON](https://docs.transifex.com/formats/json/structured-json)     | `transifex` |
