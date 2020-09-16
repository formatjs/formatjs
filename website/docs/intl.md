---
id: intl
title: Core FormatJS Intl
---

This library contains core intl API that is used by `react-intl`.

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
npm i -S @formatjs/intl
```

</TabItem>
<TabItem value="yarn">

```sh
yarn add -S @formatjs/intl
```

</TabItem>
</Tabs>

## The `intl` object

The core of `@formatjs/intl` is the `intl` object (of type [`IntlShape`](#intlshape)), which is the instance to store a cache of all `Intl.*` APIs, configurations, compiled messages and such. The lifecycle of the `intl` object is typically tied to the `locale` & the list of `messages` that it contains, which means when you switch `locale`, this object should be recreated.

:::tip
The `intl` object should be reused as much as possible for performance.
:::

## createIntl

This allows you to create an `IntlShape` object that contains all `format*` methods. For example:

```tsx
import {createIntl, createIntlCache} from '@formatjs/intl'

// This is optional but highly recommended
// since it prevents memory leak
const cache = createIntlCache()

const intl = createIntl(
  {
    locale: 'fr-FR',
    messages: {},
  },
  cache
)

// Call imperatively
intl.formatNumber(20)
```

## IntlShape

```ts
interface IntlConfig {
  locale: string
  timeZone?: string
  formats: CustomFormats
  messages: Record<string, string> | Record<string, MessageFormatElement[]>
  defaultLocale: string
  defaultRichTextElements?: Record<string, FormatXMLElementFn<React.ReactNode>>
  defaultFormats: CustomFormats
  onError(err: string): void
}

interface IntlFormatters {
  formatDate(value: number | Date | string, opts?: FormatDateOptions): string
  formatTime(value: number | Date | string, opts?: FormatDateOptions): string
  formatDateToParts(
    value: number | Date | string,
    opts?: FormatDateOptions
  ): Intl.DateTimeFormatPart[]
  formatTimeToParts(
    value: number | Date | string,
    opts?: FormatDateOptions
  ): Intl.DateTimeFormatPart[]
  formatRelativeTime(
    value: number,
    unit?: FormattableUnit,
    opts?: FormatRelativeTimeOptions
  ): string
  formatNumber(value: number, opts?: FormatNumberOptions): string
  formatNumberToParts(
    value: number,
    opts?: FormatNumberOptions
  ): Intl.NumberFormatPart[]
  formatPlural(
    value: number | string,
    opts?: FormatPluralOptions
  ): ReturnType<Intl.PluralRules['select']>
  formatMessage(
    descriptor: MessageDescriptor,
    values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>
  ): string
  formatMessage(
    descriptor: MessageDescriptor,
    values?: Record<string, PrimitiveType | T | FormatXMLElementFn<T, R>>
  ): R
  formatList(values: Array<string>, opts?: FormatListOptions): string
  formatList(
    values: Array<string | T>,
    opts?: FormatListOptions
  ): T | string | Array<string | T>
  formatDisplayName(
    value: string,
    opts?: FormatDisplayNameOptions
  ): string | undefined
}

type IntlShape = IntlConfig & IntlFormatters
```

The definition above shows what the `intl` object will look like. It's made up of two parts:

- **`IntlConfig`:** The intl metadata passed as props into the parent `<IntlProvider>`.
- **`IntlFormatters`:** The imperative formatting API described below.

### locale, formats, and messages

The user's current locale and what the app should be rendered in. While `defaultLocale` and `defaultFormats` are for fallbacks or during development and represent the app's default. Notice how there is no `defaultMessages`, that's because each [Message Descriptor](#message-descriptor) provides a `defaultMessage`.

### defaultLocale and defaultFormats

Default locale & formats for when a message is not translated (missing from `messages`). `defaultLocale` should be the locale that `defaultMessage`s are declared in so that a sentence is coherent in a single locale. Without `defaultLocale` and/or if it's set incorrectly, you might run into scenario where a sentence is in English but embeded date/time is in Spanish.

### onError

Allows the user to provide a custom error handler. By default, error messages are logged using `console.error` if `NODE_ENV` is not set to `production`.

### defaultRichTextElements

A map of tag to rich text formatting function. This is meant to provide a centralized way to format common tags such as `<b>`, `<p>`... or enforcing certain Design System in the codebase (e.g standardized `<a>` or `<button>`...). See https://github.com/formatjs/formatjs/issues/1752 for more context.

## formatDate

```tsx
function formatDate(
  value: number | Date,
  options?: Intl.DateTimeFormatOptions & {format?: string}
): string
```

This function will return a formatted date string. It expects a `value` which can be parsed as a date (i.e., `isFinite(new Date(value))`), and accepts `options` that conform to `DateTimeFormatOptions`.

```ts live
intl.formatDate(Date.now(), {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
})
```

## formatTime

```tsx
function formatTime(
  value: number | Date,
  options?: Intl.DateTimeFormatOptions & {format?: string}
): string
```

This function will return a formatted date string, but it differs from [`formatDate`](#formatdate) by having the following default options:

```tsx
{
    hour: 'numeric',
    minute: 'numeric',
}
```

It expects a `value` which can be parsed as a date (i.e., `isFinite(new Date(value))`), and accepts `options` that conform to `DateTimeFormatOptions`.

```tsx live
intl.formatTime(Date.now()) // "4:03 PM"
```

## formatRelativeTime

:::caution browser support
This requires [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat) which has limited browser support. Please use our [polyfill](./polyfills/intl-relativetimeformat.md) if you plan to support them.
:::

```tsx
type Unit =
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'

type RelativeTimeFormatOptions = {
  numeric?: 'always' | 'auto'
  style?: 'long' | 'short' | 'narrow'
}

function formatRelativeTime(
  value: number,
  unit: Unit,
  options?: Intl.RelativeTimeFormatOptions & {
    format?: string
  }
): string
```

This function will return a formatted relative time string (e.g., "1 hour ago"). It expects a `value` which is a number, a `unit` and `options` that conform to `Intl.RelativeTimeFormatOptions`.

```tsx live
intl.formatRelativeTime(0)
```

```tsx live
intl.formatRelativeTime(-24, 'hour', {style: 'narrow'})
```

## formatNumber

This function uses [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat) options.

```ts
function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions & {format?: string}
): string
```

This function will return a formatted number string. It expects a `value` which can be parsed as a number, and accepts `options` that conform to `NumberFormatOptions`.

```tsx live
intl.formatNumber(1000, {style: 'currency', currency: 'USD'})
```

**Formatting Number using `unit`**

Currently this is part of ES2020 [NumberFormat](https://tc39.es/ecma402/#numberformat-objects).
We've provided a polyfill [here](./polyfills/intl-numberformat.md) and `@formatjs/intl` types allow users to pass
in a [sanctioned unit](./polyfills/intl-numberformat.md#SupportedUnits):

```tsx live
intl.formatNumber(1000, {
  style: 'unit',
  unit: 'kilobyte',
  unitDisplay: 'narrow',
})
```

```tsx live
intl.formatNumber(1000, {
  unit: 'fahrenheit',
  unitDisplay: 'long',
  style: 'unit',
})
```

## formatPlural

```ts
type PluralFormatOptions = {
  type?: 'cardinal' | 'ordinal' = 'cardinal'
}

function formatPlural(
  value: number,
  options?: Intl.PluralFormatOptions
): 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'
```

This function will return a plural category string: `"zero"`, `"one"`, `"two"`, `"few"`, `"many"`, or `"other"`. It expects a `value` which can be parsed as a number, and accepts `options` that conform to `PluralFormatOptions`.

This is a low-level utility whose output could be provided to a `switch` statement to select a particular string to display.

```tsx live
intl.formatPlural(1)
```

```tsx live
intl.formatPlural(3, {style: 'ordinal'})
```

```tsx live
intl.formatPlural(4, {style: 'ordinal'})
```

:::danger multiple language support
This function should only be used in apps that only need to support one language. If your app supports multiple languages use [`formatMessage`](#formatmessage) instead.
:::

## formatList

:::caution browser support
This requires [Intl.ListFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat) which has limited browser support. Please use our [polyfill](./polyfills/intl-listformat.md) if you plan to support them.
:::

```ts
type ListFormatOptions = {
  type?: 'disjunction' | 'conjunction' | 'unit'
  style?: 'long' | 'short' | 'narrow'
}

function formatList(
  elements: (string | React.ReactNode)[],
  options?: Intl.ListFormatOptions
): string | React.ReactNode[]
```

This function allows you to join list of things together in an i18n-safe way. For example, when the locale is `en`:

```tsx live
intl.formatList(['Me', 'myself', 'I'], {type: 'conjunction'})
```

```tsx live
intl.formatList(['5 hours', '3 minutes'], {type: 'unit'})
```

## formatDisplayName

:::caution browser support
This requires [Intl.DisplayNames](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames) which has limited browser support. Please use our [polyfill](./polyfills/intl-displaynames.md) if you plan to support them.
:::

```ts
type FormatDisplayNameOptions = {
  style?: 'narrow' | 'short' | 'long'
  type?: 'language' | 'region' | 'script' | 'currency'
  fallback?: 'code' | 'none'
}

function formatDisplayName(
  value: string | number | object,
  options?: FormatDisplayNameOptions
): string | undefined
```

Usage examples:

```ts live
intl.formatDisplayName('zh-Hans-SG', {type: 'language'})
```

```ts live
// ISO-15924 four letters script code to localized display name
intl.formatDisplayName('Deva', {type: 'script'})
```

```ts live
// ISO-4217 currency code to localized display name
intl.formatDisplayName('CNY', {type: 'currency'})
```

```ts live
// ISO-3166 two letters region code to localized display name
intl.formatDisplayName('UN', {type: 'region'})
```

## formatMessage

### Message Syntax

String/Message formatting is a paramount feature of React Intl and it builds on [ICU Message Formatting](http://userguide.icu-project.org/formatparse/messages) by using the [ICU Message Syntax](./core-concepts/icu-syntax.md). This message syntax allows for simple to complex messages to be defined, translated, and then formatted at runtime.

**Simple Message:**

```
Hello, {name}
```

**Complex Message:**

```
Hello, {name}, you have {itemCount, plural,
    =0 {no items}
    one {# item}
    other {# items}
}.
```

**See:** The [Message Syntax Guide](./core-concepts/icu-syntax.md).

### Message Descriptor

React Intl has a Message Descriptor concept which is used to define your app's default messages/strings and is passed into `formatMessage`. The Message Descriptors work very well for providing the data necessary for having the strings/messages translated, and they contain the following properties:

- **`id`:** A unique, stable identifier for the message
- **`description`:** Context for the translator about how it's used in the UI
- **`defaultMessage`:** The default message (probably in English)

```tsx
type MessageDescriptor = {
  id: string
  defaultMessage?: string
  description?: string | object
}
```

:::info Extracting Message Descriptor
You can extract inline-declared messages from source files using [our CLI](http://localhost:3000/docs/getting-started/message-extraction).
:::

### Message Formatting Fallbacks

The message formatting APIs go the extra mile to provide fallbacks for the common situations where formatting fails; at the very least a non-empty string should always be returned. Here's the message formatting fallback algorithm:

1. Lookup and format the translated message at `id`, passed to `<IntlProvider>`.
2. Fallback to formatting the `defaultMessage`.
3. Fallback to source of translated message at `id`.
4. Fallback to source of `defaultMessage`.
5. Fallback to the literal message `id`.

Above, "source" refers to using the template as is, without any substitutions made.

### Usage

```ts
type MessageFormatPrimitiveValue = string | number | boolean | null | undefined
function formatMessage(
  descriptor: MessageDescriptor,
  values?: Record<string, MessageFormatPrimitiveValue>
): string
function formatMessage(
  descriptor: MessageDescriptor,
  values?: Record<
    string,
    MessageFormatPrimitiveValue | React.ReactElement | FormatXMLElementFn
  >
): string | React.ReactNodeArray
```

This function will return a formatted message string. It expects a `MessageDescriptor` with at least an `id` property, and accepts a shallow `values` object which are used to fill placeholders in the message.

If a translated message with the `id` has been passed to the `<IntlProvider>` via its `messages` prop it will be formatted, otherwise it will fallback to formatting `defaultMessage`. See: [Message Formatting Fallbacks](#message-formatting-fallbacks) for more details.

```ts live
function () {
  const messages = defineMessages({
    greeting: {
      id: 'app.greeting',
      defaultMessage: 'Hello, {name}!',
      description: 'Greeting to welcome the user to the app',
    },
  })

  return intl.formatMessage(messages.greeting, {name: 'Eric'})
}
```

with `ReactElement`

```ts live
function () {
  const messages = defineMessages({
    greeting: {
      id: 'app.greeting',
      defaultMessage: 'Hello, {name}!',
      description: 'Greeting to welcome the user to the app',
    },
  })

  return intl.formatMessage(messages.greeting, {name: <b>Eric</b>})
}
```

with rich text formatting

```ts live
function () {
  const messages = defineMessages({
    greeting: {
      id: 'app.greeting',
      defaultMessage: 'Hello, <bold>{name}</bold>!',
      description: 'Greeting to welcome the user to the app',
    },
  })

  return intl.formatMessage(messages.greeting, {
    name: 'Eric',
    bold: str => <b>{str}</b>,
  })
}
```

The message we defined using [`defineMessages`](#definemessages) to support extraction via `babel-plugin-react-intl`, but it doesn't have to be if you're not using the Babel plugin.

:::info simple message
Messages can be simple strings _without_ placeholders, and that's the most common type of message.
:::

## defineMessages/defineMessage

```ts
interface MessageDescriptor {
  id?: string
  description?: string | object
  defaultMessage?: string
}

function defineMessages(
  messageDescriptors: Record<string, MessageDescriptor>
): Record<string, MessageDescriptor>

function defineMessage(messageDescriptor: MessageDescriptor): MessageDescriptor
```

These functions is exported by the `@formatjs/intl` package and is simply a _hook_ for our CLI & babel/TS plugin to use when compiling default messages defined in JavaScript source files. This function simply returns the Message Descriptor map object that's passed-in.

```ts
import {defineMessages, defineMessage} from '@formatjs/intl'

const messages = defineMessages({
  greeting: {
    id: 'app.home.greeting',
    description: 'Message to greet the user.',
    defaultMessage: 'Hello, {name}!',
  },
})

const msg = defineMessage({
  id: 'single',
  defaultMessage: 'single message',
  description: 'header',
})
```
