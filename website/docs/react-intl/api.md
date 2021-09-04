---
id: api
title: Imperative API
---

There are a few API layers that React Intl provides and is built on. When using React Intl you'll be interacting with its API (documented here) and its React [components](./components.md).

## Why Imperative API?

While our [components](./components.md) provide a seamless integration with React, the imperative API are recommended (sometimes required) in several use cases:

- Setting text attributes such as `title`, `aria-label` and the like where a React component cannot be used (e.g `<img title/>`)
- Formatting text/datetime... in non-React environment such as Node, Server API, Redux store, testing...
- High performance scenarios where the number of React components rendered becomes the bottleneck (e.g Finance stock portfolio rendering, virtual tables with a lot of cells...)

## The `intl` object

The core of `react-intl` is the `intl` object (of type [`IntlShape`](#intlshape)), which is the instance to store a cache of all `Intl.*` APIs, configurations, compiled messages and such. The lifecycle of the `intl` object is typically tied to the `locale` & the list of `messages` that it contains, which means when you switch `locale`, this object should be recreated.

:::tip
The `intl` object should be reused as much as possible for performance.
:::

There are a few ways to get access to the `intl` object:

- `useIntl` hook: Once you've declared your `IntlProvider`, you can get access to the `intl` object via calling this hook in your functional React component
- `injectIntl` HOC: In `class`-based React components, you can wrap them with the `injectIntl` HOC and `intl` should be available as a `prop`.
- `createIntl`: In a non-React environment (Node, vue, angular, testing... you name it), you can directly create a `intl` object by calling this function with the same configuration as the `IntlProvider`.

## useIntl hook

If a component can be expressed in a form of function component, using `useIntl` hook can be handy. This `useIntl` hook does not expect any option as its argument when being called. Typically, here is how you would like to use:

```tsx
import React from 'react'
import {useIntl, FormattedDate} from 'react-intl'

const FunctionComponent: React.FC<{date: number | Date}> = ({date}) => {
  const intl = useIntl()
  return (
    <span title={intl.formatDate(date)}>
      <FormattedDate value={date} />
    </span>
  )
}

export default FunctionComponent
```

To keep the API surface clean and simple, we only provide `useIntl` hook in the package. If preferable, user can wrap this built-in hook to make customized hook like `useFormatMessage` easily. Please visit React's official website for more general [introduction on React hooks](https://reactjs.org/docs/hooks-intro.html).

## injectIntl HOC

```ts
type WrappedComponentProps<IntlPropName extends string = 'intl'> = {
  [k in IntlPropName]: IntlShape
}

type WithIntlProps<P> = Omit<P, keyof WrappedComponentProps> & {
  forwardedRef?: React.Ref<any>
}

function injectIntl<
  IntlPropName extends string = 'intl',
  P extends WrappedComponentProps<IntlPropName> = WrappedComponentProps<any>
>(
  WrappedComponent: React.ComponentType<P>,
  options?: Opts<IntlPropName>
): React.ComponentType<WithIntlProps<P>> & {
  WrappedComponent: typeof WrappedComponent
}
```

This function is exported by the `react-intl` package and is a High-Order Component (HOC) factory. It will wrap the passed-in React component with another React component which provides the imperative formatting API into the wrapped component via its `props`. (This is similar to the connect-to-stores pattern found in many Flux implementations.)

By default, the formatting API will be provided to the wrapped component via `props.intl`, but this can be overridden when specifying `options.intlPropName`. The value of the prop will be of type [`IntlShape`](#Intlshape), defined in the next section.

```tsx
import React, {PropTypes} from 'react'
import {injectIntl, FormattedDate} from 'react-intl'

interface Props {
  date: Date | number
}

const FunctionalComponent: React.FC<Props> = props => {
  const {
    date,
    intl, // Injected by `injectIntl`
  } = props
  return (
    <span title={intl.formatDate(date)}>
      <FormattedDate value={date} />
    </span>
  )
}

export default injectIntl(FunctionalComponent)
```

## createIntl

This allows you to create an `IntlShape` object without using `Provider`. This allows you to format things outside of React lifecycle while reusing the same `intl` object. For example:

```tsx
import {createIntl, createIntlCache, RawIntlProvider} from 'react-intl'

// This is optional but highly recommended
// since it prevents memory leak
const cache = createIntlCache()

const intl = createIntl({
  locale: 'fr-FR',
  messages: {}
}, cache)

// Call imperatively
intl.formatNumber(20)

// Pass it to IntlProvider
<RawIntlProvider value={intl}>{foo}</RawIntlProvider>
```

## createIntlCache

Creates a cache instance to be used globally across locales. This memoizes previously created `Intl.*` constructors for performance and is only an in-memory cache.

## IntlShape

```ts
interface IntlConfig {
  locale: string
  timeZone?: string
  formats: CustomFormats
  textComponent?: React.ComponentType | keyof React.ReactHTML
  messages: Record<string, string> | Record<string, MessageFormatElement[]>
  defaultLocale: string
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
  formatListToParts(values: Array<string | T>, opts?: FormatListOptions): Part[]
  formatDisplayName(
    value: string,
    opts?: FormatDisplayNameOptions
  ): string | undefined
}

type IntlShape = IntlConfig & IntlFormatters
```

This interface is exported by the `react-intl` package that can be used in conjunction with the [`injectIntl`](#injectintl) HOC factory function.

The definition above shows what the `props.intl` object will look like that's injected to your component via `injectIntl`. It's made up of two parts:

- **`IntlConfig`:** The intl metadata passed as props into the parent `<IntlProvider>`.
- **`IntlFormatters`:** The imperative formatting API described below.

### locale, formats, and messages

The user's current locale and what the app should be rendered in. While `defaultLocale` and `defaultFormats` are for fallbacks or during development and represent the app's default. Notice how there is no `defaultMessages`, that's because each [Message Descriptor](#message-descriptor) provides a `defaultMessage`.

### defaultLocale and defaultFormats

Default locale & formats for when a message is not translated (missing from `messages`). `defaultLocale` should be the locale that `defaultMessage`s are declared in so that a sentence is coherent in a single locale. Without `defaultLocale` and/or if it's set incorrectly, you might run into scenario where a sentence is in English but embedded date/time is in Spanish.

### textComponent

Provides a way to configure the default wrapper for React Intl's `<Formatted*>` components. If not specified, [`<React.Fragment>`](https://reactjs.org/docs/fragments.html) is used. Before V3, `span` was used instead; check the [migration guide](upgrade-guide-3.x.md) for more info.

### onError

Allows the user to provide a custom error handler. By default, error messages are logged using `console.error` if `NODE_ENV` is not set to `production`.

### wrapRichTextChunksInFragment

When formatting rich text message, the output we produced is of type `Array<string | React.ReactElement>`, which will trigger key error. This wraps the output in a single `React.Fragment` to suppress that.

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
intl.formatTime(Date.now()) /* "4:03 PM" */
```

## formatDateTimeRange

:::caution browser support
This requires stage-3 API [Intl.RelativeTimeFormat.prototype.formatRange](https://github.com/tc39/proposal-intl-DateTimeFormat-formatRange) which has limited browser support. Please use our [polyfill](../polyfills/intl-datetimeformat.md) if you plan to support them.
:::

```tsx
function formatDateTimeRange(
  from: number | Date,
  to: number | Date,
  options?: Intl.DateTimeFormatOptions & {format?: string}
): string
```

This function will return a formatted date/time range string

It expects 2 values (a `from` Date & a `to` Date) and accepts `options` that conform to `DateTimeFormatOptions`.

```tsx live
intl.formatDateTimeRange(new Date('2020-1-1'), new Date('2020-1-15'))
```

## formatRelativeTime

:::caution browser support
This requires [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat) which has limited browser support. Please use our [polyfill](../polyfills/intl-relativetimeformat.md) if you plan to support them.
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
We've provided a polyfill [here](../polyfills/intl-numberformat.md) and `react-intl` types allow users to pass
in a [sanctioned unit](../polyfills/intl-numberformat.md#SupportedUnits):

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
This requires [Intl.ListFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat) which has limited browser support. Please use our [polyfill](../polyfills/intl-listformat.md) if you plan to support them.
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
This requires [Intl.DisplayNames](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames) which has limited browser support. Please use our [polyfill](../polyfills/intl-displaynames.md) if you plan to support them.
:::

```ts
type FormatDisplayNameOptions = {
  style?: 'narrow' | 'short' | 'long'
  type?: 'language' | 'region' | 'script' | 'currency'
  fallback?: 'code' | 'none'
}

function formatDisplayName(
  value: string | number | Record<string, unknown>,
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

String/Message formatting is a paramount feature of React Intl and it builds on [ICU Message Formatting](https://unicode-org.github.io/icu/userguide/format_parse/messages) by using the [ICU Message Syntax](../core-concepts/icu-syntax.md). This message syntax allows for simple to complex messages to be defined, translated, and then formatted at runtime.

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

**See:** The [Message Syntax Guide](../core-concepts/icu-syntax.md).

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
You can extract inline-declared messages from source files using [our CLI](../getting-started/message-extraction.md).
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

The message we defined using [`defineMessages`](#definemessages) to support extraction via `babel-plugin-formatjs`, but it doesn't have to be if you're not using the Babel plugin.

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

These functions is exported by the `react-intl` package and is simply a _hook_ for our CLI & babel/TS plugin to use when compiling default messages defined in JavaScript source files. This function simply returns the Message Descriptor map object that's passed-in.

```ts
import {defineMessages, defineMessage} from 'react-intl'

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
