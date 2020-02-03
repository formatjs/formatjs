# eslint-plugin-formatjs

This eslint plugin allows you to enforce certain rules in your ICU message. This is currently under development

## Usage

```bash
npm install eslint-plugin-formatjs
```

Then in your eslint config:

```json
{
  "plugins": ["formatjs"],
  "rules": {
    "formatjs/no-offset": "error"
  }
}
```

Currently this uses `intl.formatMessage`, `defineMessages`, `<FormattedMessage>` from `react-intl`, or `_` from `@formatjs/macro` as hooks to verify the message. Therefore, in your code use 1 of the following mechanisms:

```tsx
import {_} from '@formatjs/macro';

const message = _({
  defaultMessage: 'foo',
  description: 'bar',
});
```

```tsx
import {defineMessages} from 'react-intl';

const messages = defineMessages({
  foo: {
    defaultMessage: 'foo',
    description: 'bar',
  },
});
```

```tsx
import {FormattedMessage} from 'react-intl';

<FormattedMessage defaultMessage="foo" description="bar" />;
```

```tsx
function foo() {
  intl.formatMessage({
    defaultMessage: 'foo',
  });
}
```

## Available Rules

### `blacklist-elements`

This blacklists usage of specific elements in ICU message.

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
    "formatjs/blacklist-elements": [2, ["selectordinal"]]
  }
}
```

### `enforce-description`

This enforces `description` in the message descriptor.

#### Why

- Description provides helpful context for translators

```tsx
import {defineMessages} from 'react-intl';

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
});
```

### `enforce-default-message`

This enforces `defaultMessage` in the message descriptor.

#### Why

- Can be usefull in case we want to extract messages for translations from source code. This way can make sure people won't forget about defaultMessage

```tsx
import {defineMessages} from 'react-intl';

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
});
```

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
import {defineMessages} from 'react-intl';

const messages = defineMessages({
  // WORKS
  foo: {
    defaultMessage: 'foo {snake_case} {nothing}',
  },
  // FAILS
  bar: {
    defaultMessage: 'foo {camelCase}',
  },
});
```

### `no-emoji`

This prevents usage of emoji in message.

#### Why

- Certain translation vendors cannot handle emojis.
- Cross-platform encoding for emojis are faulty.

```tsx
import {defineMessages} from 'react-intl';

const messages = defineMessages({
  // WORKS
  foo: {
    defaultMessage: 'Smileys & People',
  },
  // FAILS
  bar: {
    defaultMessage: '😃 Smileys & People',
  },
});
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
import {defineMessages} from 'react-intl';

const messages = defineMessages({
  // WORKS
  foo: {
    defaultMessage: '{var, plural, one{one} other{other}}',
  },
  // FAILS
  bar: {
    defaultMessage: '{var, plural, offset:1 one{one} other{other}}',
  },
});
```

### `supported-datetime-skeleton`

Since formatjs only supports a subset of [DateTime Skeleton](../intl-messageformat-parser/README.md#Supported-DateTime-Skeleton). This rule exists to make sure you don't use a unsupported pattern.
