---
id: linter
title: eslint-plugin-formatjs
---

This eslint plugin allows you to enforce certain rules in your ICU message.

## Usage

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
npm i -D eslint-plugin-formatjs
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add -D eslint-plugin-formatjs
```

</TabItem>
</Tabs>

Then in your eslint config:

```json
{
  "plugins": ["formatjs"],
  "rules": {
    "formatjs/no-offset": "error"
  }
}
```

### React

Currently this uses `intl.formatMessage`, `defineMessage`, `defineMessages`, `<FormattedMessage>` from `react-intl` as hooks to verify the message. Therefore, in your code use 1 of the following mechanisms:

```tsx
import {defineMessages, defineMessage} from 'react-intl'

const messages = defineMessages({
  foo: {
    defaultMessage: 'foo',
    description: 'bar',
  },
})

defineMessage({
  defaultMessage: 'single message',
})
```

```tsx
import {FormattedMessage} from 'react-intl'
;<FormattedMessage defaultMessage="foo" description="bar" />
```

```tsx
function foo() {
  intl.formatMessage({
    defaultMessage: 'foo',
  })
}
```

### Vue

This will check against `intl.formatMessage`, `$formatMessage` function calls in both your JS/TS & your SFC `.vue` files. For example:

```vue
<template>
  <p>
    {{
      $formatMessage({
        defaultMessage: 'today is {now, date}',
      })
    }}
  </p>
</template>
```

## Shared Settings

These settings are applied globally to all formatjs rules once specified. See [Shared Settings](https://eslint.org/docs/user-guide/configuring/configuration-files#adding-shared-settings) for more details on how to set them.

### `formatjs.additionalFunctionNames`

Similar to [babel-plugin-formatjs](./babel-plugin.md#additionalfunctionnames) & [@formatjs/ts-transformer](./ts-transformer.md#additionalfunctionnames), this allows you to specify additional function names to check besides `formatMessage` & `$formatMessage`.

### `formatjs.additionalComponentNames`

Similar to [babel-plugin-formatjs](./babel-plugin.md#additionalcomponentnames) & [@formatjs/ts-transformer](./ts-transformer.md#additionalcomponentnames), this allows you to specify additional component names to check besides `FormattedMessage`.

## Available Rules

### `blocklist-elements`

This blocklists usage of specific elements in ICU message.

#### Why

- Certain translation vendors cannot handle things like `selectordinal`

#### Available elements

```tsx
enum Element {
  // literal text, like `defaultMessage: 'some text'`
  literal = 'literal',
  // placeholder, like `defaultMessage: '{placeholder} var'`
  argument = 'argument',
  // number, like `defaultMessage: '{placeholder, number} var'`
  number = 'number',
  // date, like `defaultMessage: '{placeholder, date} var'`
  date = 'date',
  // time, like `defaultMessage: '{placeholder, time} var'`
  time = 'time',
  // select, like `defaultMessage: '{var, select, foo{one} bar{two}} var'`
  select = 'select',
  // selectordinal, like `defaultMessage: '{var, selectordinal, one{one} other{two}} var'`
  selectordinal = 'selectordinal',
  // plural, like `defaultMessage: '{var, plural, one{one} other{two}} var'`
  plural = 'plural',
}
```

#### Example

```json
{
  "plugins": ["formatjs"],
  "rules": {
    "formatjs/blocklist-elements": [2, ["selectordinal"]]
  }
}
```

### `enforce-description`

This enforces `description` in the message descriptor.

#### Why

- Description provides helpful context for translators

```tsx
import {defineMessages} from 'react-intl'

const messages = defineMessages({
  // WORKS
  foo: {
    defaultMessage: 'foo',
    description: 'bar',
  },
  // FAILS
  bar: {
    defaultMessage: 'bar',
  },
})
```

#### Options

```json
{
  "plugins": ["formatjs"],
  "rules": {
    "formatjs/enforce-description": ["error", "literal"]
  }
}
```

Setting `literal` forces `description` to always be a string literal instead of function calls or variables. This is helpful for extraction tools that expects `description` to always be a literal

### `enforce-default-message`

This enforces `defaultMessage` in the message descriptor.

#### Why

- Can be useful in case we want to extract messages for translations from source code. This way can make sure people won't forget about defaultMessage

```tsx
import {defineMessages} from 'react-intl'

const messages = defineMessages({
  // WORKS
  foo: {
    defaultMessage: 'This is default message',
    description: 'bar',
  },
  // FAILS
  bar: {
    description: 'bar',
  },
})
```

#### Options

```json
{
  "plugins": ["formatjs"],
  "rules": {
    "formatjs/enforce-default-message": ["error", "literal"]
  }
}
```

Setting `literal` forces `defaultMessage` to always be a string literal instead of function calls or variables. This is helpful for extraction tools that expects `defaultMessage` to always be a literal

### `enforce-placeholders`

Makes sure all values are passed in if message has placeholders (number/date/time/plural/select/selectordinal). This requires values to be passed in as literal object (not a variable).

```tsx
// WORKS, no error
<FormattedMessage
  defaultMessage="this is a {placeholder}"
  values={{placeholder: 'dog'}}
/>

// WORKS, no error
intl.formatMessage({
  defaultMessage: 'this is a {placeholder}'
}, {placeholder: 'dog'})

// WORKS, error bc no values were provided
<FormattedMessage
  defaultMessage="this is a {placeholder}"
/>

// WORKS, error bc no values were provided
intl.formatMessage({
  defaultMessage: 'this is a {placeholder}'
})

// WORKS, error bc `placeholder` is not passed in
<FormattedMessage
  defaultMessage="this is a {placeholder}"
  values={{foo: 1}}
/>

// WORKS, error bc `placeholder` is not passed in
intl.formatMessage({
  defaultMessage: 'this is a {placeholder}'
}, {foo: 1})

// DOESN'T WORK
<FormattedMessage
  defaultMessage="this is a {placeholder}"
  values={someVar}
/>

// DOESN'T WORK
intl.formatMessage({
  defaultMessage: 'this is a {placeholder}'
}, values)
```

#### Options

```json
{
  "plugins": ["formatjs"],
  "rules": {
    "formatjs/enforce-placeholders": [
      "error",
      {
        "ignoreList": ["foo"]
      }
    ]
  }
}
```

- `ignoreList`: List of placeholder names to ignore. This works with `defaultRichTextElements` in `react-intl` so we don't provide false positive for ambient global tag formatting

### `enforce-plural-rules`

Enforce certain plural rules to always be specified/forbidden in a message.

#### Why

- It is recommended to always specify `other` as fallback in the message.
- Some translation vendors only accept certain rules.

#### Available rules

```tsx
enum LDML {
  zero = 'zero',
  one = 'one',
  two = 'two',
  few = 'few',
  many = 'many',
  other = 'other',
}
```

#### Example

```json
{
  "plugins": ["formatjs"],
  "rules": {
    "formatjs/enforce-plural-rules": [
      2,
      {
        "one": true,
        "other": true,
        "zero": false
      }
    ]
  }
}
```

### `no-camel-case`

This make sure placeholders are not camel-case.

#### Why

- This is to prevent case-sensitivity issue in certain translation vendors.

```tsx
import {defineMessages} from 'react-intl'

const messages = defineMessages({
  // WORKS
  foo: {
    defaultMessage: 'foo {snake_case} {nothing}',
  },
  // FAILS
  bar: {
    defaultMessage: 'foo {camelCase}',
  },
})
```

### `no-emoji`

This prevents usage of emoji in message.

#### Why

- Certain translation vendors cannot handle emojis.
- Cross-platform encoding for emojis are faulty.

```tsx
import {defineMessages} from 'react-intl'

const messages = defineMessages({
  // WORKS
  foo: {
    defaultMessage: 'Smileys & People',
  },
  // FAILS
  bar: {
    defaultMessage: '😃 Smileys & People',
  },
})
```

### `no-literal-string-in-jsx`

This prevents untranslated strings in JSX.

#### Why

- It is easy to forget wrapping JSX text in translation functions or components.
- It is easy to forget wrapping certain accessibility attributes (e.g. `aria-label`) in translation functions.

```tsx
// WORKS
<Button>
  <FormattedMessage defaultMessage="Submit" />
</Button>
// WORKS
<Button>
  {customTranslateFn("Submit")}
</Button>
// WORKS
<input aria-label={intl.formatMessage({defaultMessage: "Label"})} />
// WORKS
<img
  src="/example.png"
  alt={intl.formatMessage({defaultMessage: "Image description"})}
/>
// FAILS
<Button>Submit</Button>
// FAILS
<Button>{'Submit'}</Button>
// FAILS
<Button>{`Te` + 's' + t}</Button>
// FAILS
<input aria-label="Untranslated label" />
// FAILS
<img src="/example.png" alt="Image description" />
// FAILS
<input aria-label={`Untranslated label`} />
```

This linter reporter text literals or string expressions, including string
concatenation expressions in the JSX children. It also checks certain JSX
attributes that you can customize. Example:

```javascript
// In .eslintrc.js
module.exports = {
  // other rules...
  'formatjs/no-literal-string-in-jsx': [
    2,
    {
      // Include or exclude additional prop checks (merged with the default checks)
      props: {
        include: [
          // picomatch style glob pattern for tag name and prop name.
          // check `name` prop of `UI.Button` tag.
          ['UI.Button', 'name'],
          // check `message` of any component.
          ['*', 'message'],
        ],
        // Exclude will always override include.
        exclude: [
          // do not check `message` of the `Foo` tag.
          ['Foo', 'message'],
          // do not check aria-label and aria-description of `Bar` tag.
          ['Bar', 'aria-{label,description}'],
        ],
      },
    },
  ],
}
```

The default prop checks are:

```jsx
{
  include: [
    // check aria attributes that the screen reader announces.
    ['*', 'aria-{label,description,details,errormessage}'],
    // check placeholder and title attribute of all native DOM elements.
    ['[a-z]*([a-z0-9])', '(placeholder|title)'],
    // check alt attribute of the img tag.
    ['img', 'alt'],
  ],
  exclude: []
}
```

### `no-multiple-whitespaces`

This prevents usage of multiple consecutive whitespaces in message.

#### Why

- Consecutive whitespaces are handled differently in different locales.
- Prevents `\` linebreaks in JS string which results in awkward whitespaces.

```tsx
import {defineMessages} from 'react-intl'

const messages = defineMessages({
  // WORKS
  foo: {
    defaultMessage: 'Smileys & People',
  },
  // FAILS
  bar: {
    defaultMessage: 'Smileys &   People',
  },
  // FAILS
  baz: {
    defaultMessage:
      'this message is too long \
    so I wanna line break it.',
  },
})
```

### `no-multiple-plurals`

This prevents specifying multiple plurals in your message.

#### Why

- Nested plurals are hard to translate across languages so some translation vendors don't allow it.

```tsx
import {defineMessages} from 'react-intl'

const messages = defineMessages({
    // WORKS
    foo: {
        defaultMessage: '{p1, plural, one{one}}',
    },
    // FAILS
    bar: {
        defaultMessage: '{p1, plural, one{one}} {p2, plural, one{two}}',
    }
    // ALSO FAILS
    bar2: {
        defaultMessage: '{p1, plural, one{{p2, plural, one{two}}}}',
    }
})
```

### `no-offset`

This prevents specifying offset in plural rules in your message.

#### Why

- Offset has complicated logic implication so some translation vendors don't allow it.

```tsx
import {defineMessages} from 'react-intl'

const messages = defineMessages({
  // PASS
  foo: {
    defaultMessage: '{var, plural, one{one} other{other}}',
  },
  // FAILS
  bar: {
    defaultMessage: '{var, plural, offset:1 one{one} other{other}}',
  },
})
```

### `enforce-id`

This enforces generated ID to be set in `MessageDescriptor`.

#### Why

Pipelines can enforce automatic/manual ID generation at the linter level (autofix to insert autogen ID) so this guarantees that.

```tsx
import {defineMessages} from 'react-intl';

const messages = defineMessages({
  // PASS
  foo: {
    id: '19shaf'
    defaultMessage: '{var, plural, one{one} other{other}}',
  },
  // FAILS
  bar: {
    id: 'something',
    defaultMessage: '{var, plural, offset:1 one{one} other{other}}',
  },
  // FAILS
  bar: {
    defaultMessage: '{var, plural, offset:1 one{one} other{other}}',
  },
});
```

#### Options

```json
{
  "plugins": ["formatjs"],
  "rules": {
    "formatjs/enforce-id": [
      "error",
      {
        "idInterpolationPattern": "[sha512:contenthash:base64:6]"
      }
    ]
  }
}
```

- `idInterpolationPattern`: Pattern to verify ID against
- `idWhitelist`: An array of strings with regular expressions. This array allows allowlist custom ids for messages. For example '`\\.`' allows any id which has dot; `'^payment_.*'` - allows any custom id which has prefix `payment_`. Be aware that any backslash \ provided via string must be escaped with an additional backslash.

### `no-invalid-icu`

This bans strings inside `defaultMessage` that are syntactically invalid.

#### Why

It's easy to miss strings that look correct to you as a developer but which are actually syntactically invalid ICU strings. For instance, the following would cause an eslint error:

```typescript
formatMessage(
  {
    defaultMessage: '{count, plural one {#} other {# more}}', //Missing a comma!
  },
  {
    count: 1,
  }
)
```

### `no-id`

This bans explicit ID in `MessageDescriptor`.

#### Why

We generally encourage automatic ID generation due to [these reasons](https://formatjs.io/docs/getting-started/message-declaration). This makes sure no explicit IDs are set.

### `no-complex-selectors`

Make sure a sentence is not too complex.
Complexity is determined by how many strings are produced when we try to flatten the sentence given its selectors. For example:

```
I have {count, plural, one{a dog} other{many dogs}}
```

has the complexity of 2 because flattening the plural selector results in 2 sentences: `I have a dog` & `I have many dogs`.
Default complexity limit is 20 (using [Smartling as a reference](https://help.smartling.com/hc/en-us/articles/360008030994-ICU-MessageFormat))

#### Options

```json
{
  "plugins": ["formatjs"],
  "rules": {
    "formatjs/no-complex-selectors": [
      "error",
      {
        "limit": 3
      }
    ]
  }
}
```

### `no-invalid-icu`

This validates the ICU syntax.

#### Why

This will make sure that the ICU message are valid and ready for translation.

### `no-useless-message`

This bans messages that do not require translation.

#### Why

Messages like `{test}` is not actionable by translators. The code should just directly reference `test`.
