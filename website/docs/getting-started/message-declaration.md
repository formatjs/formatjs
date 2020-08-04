---
id: message-declaration
title: Message Declaration
---

While you can declare your messages using only `id`s, we highly recommend declaring `defaultMessage`s inline along with their usages because of the following reasons:

1. Messages colocated with their usages become self-managed, as their usages change/removed, so are the messages.
2. Messages are highly contextual. We've seen a lot of cases where developers assume a certain grammar when they write their messages. Buttons/Call-To-Actions and labels are also translated differently.
3. Text styling is also dependent on the message itself. Things like truncation, capitalization... certainly affect the messages themselves.
4. Better integrations with toolchains. Most toolchains cannot verify cross-file references to validate syntax/usage.

## How to declare a message

At a high level, formatjs messages use [ICU Syntax](../core-concepts/icu-syntax.md) with a couple of enhancements common in other message format such as [Fluent](https://github.com/projectfluent/fluent.js/). This section focuses on the actual supported ways of calling `formatjs` APIs so messages can be extracted.

1. Using imperative API `intl.formatMessage`

```tsx
// Method must be exactly `intl.formatMessage`
intl.formatMessage(
  {
    description: 'A message', // Description should be a string literal
    defaultMessage: 'My name is {name}', // Message should be a string literal
  },
  {
    name: userName,
  } // Values should be an object literal, but not necessarily every value inside
);
```

:::caution
We rely on AST to extract messages from the codebase, thus calling `intl.formatMessage()` exactly is required (not `formatMessage()` or `const {formatMessage: f} = intl; f()` or the like)
:::

2. Using React API `<FormattedMessage/>`

```tsx
import {FormattedMessage} from 'react-intl';
<FormattedMessage
  description="A message" // Description should be a string literal
  defaultMessage="My name is {name}" // Message should be a string literal
  values={
    {
      name: userName,
    } // Values should be an object literal, but not necessarily every value inside
  }
/>;
```

:::caution
We rely on AST to extract messages from the codebase, thus calling `FormattedMessage` exactly is required (not `const F = FormattedMessage; <F />` or the like)
:::

3. Pre-declaring using `defineMessage` for later consumption (less recommended)

```tsx
import {defineMessage} from 'react-intl';
const message = defineMessage({
  description: 'A message', // Description should be a string literal
  defaultMessage: 'My name is {name}', // Message should be a string literal
});

intl.formatMessage(message, {name: 'John'}); // My name is John

<FormattedMessage
  {...message}
  values={{
    name: 'John',
  }}
/>; // My name is John
```

:::caution
You can declare a message without immediately formatting it with `defineMessage` and our extractor would still be able to extract it. However, our [enforce-placeholders](../tooling/linter.md#enforce-placeholders) linter rule won't be able to analyze it.
:::
