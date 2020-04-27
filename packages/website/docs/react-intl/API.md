---
id: api
title: Imperative API
---

There are a few API layers that React Intl provides and is built on. When using React Intl you'll be interacting with its API (documented here) and its React [components][components].

## ECMAScript Internationalization API

**React Intl uses and builds on the [Internationalization API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) built-in to JavaScript.**

Specifically, the built-in API is used to format dates/times and numbers in React Intl. It's good to familiarize yourself with the following APIs, **especially their `options`:**

- [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat)
- [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat)
- [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules)
- [`Intl.RelativeTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat)

React Intl wraps these APIs in a consistent way making them easier to use, more performant through memoization, and gracefully falls back when they throw errors.

## FormatJS Internationalization Formatters

Beyond number, date & relative time formatting, React Intl provides string/message formatting. This formatter is part of the [FormatJS](http://formatjs.io/) project, which React Intl is also a part of. This formatter was developed in the same style as the built-in formatters.

- [`IntlMessageFormat`](https://github.com/formatjs/formatjs/tree/master/packages/intl-messageformat)

React Intl wraps these APIs in the same way it wraps the built-in Intl APIs.

## `defineMessages/defineMessage`

```ts
interface MessageDescriptor {
  id: string;
  description?: string | object;
  defaultMessage?: string;
}

function defineMessages(
  messageDescriptors: Record<string, MessageDescriptor>
): Record<string, MessageDescriptor>;

function defineMessage(messageDescriptor: MessageDescriptor): MessageDescriptor;
```

These functions is exported by the `react-intl` package and is simply a _hook_ for the [babel-plugin-react-intl](https://github.com/formatjs/formatjs/tree/master/packages/babel-plugin-react-intl) package to use when extracting default messages defined in JavaScript source files. This function simply returns the Message Descriptor map object that's passed-in.

```ts
import {defineMessages, defineMessage} from 'react-intl';

const messages = defineMessages({
  greeting: {
    id: 'app.home.greeting',
    description: 'Message to greet the user.',
    defaultMessage: 'Hello, {name}!',
  },
});

const msg = defineMessage({
  id: 'single'
  defaultMessage: 'single message',
  description: 'header'
})
```

## Injection API

React Intl provides:

1. [`useIntl` hook](#useintl-hook): to _hook_ the imperative formatting API into a React function component (with React version >= 16.8).
2. [`injectIntl` HOC](#injectintl-hoc): to _inject_ the imperative formatting API into a React class or function component via its `props`.
3. [`createIntl`](#createintl): to create `IntlShape` object outside of React lifecycle.

These should be used when your React component needs to format data to a string value where a React element is not suitable; e.g., a `title` or `aria` attribute, or for side-effect in `componentDidMount`.

### `useIntl` hook

If a component can be expressed in a form of function component, using `useIntl` hook can be handy. This `useIntl` hook do not expect any option as its argument when being called. Typically, here is how you would like to use:

```tsx
import React from 'react';
import {useIntl, FormattedDate} from 'react-intl';

const FunctionComponent: React.FC<{date: number | Date}> = ({date}) => {
  const intl = useIntl();
  return (
    <span title={intl.formatDate(date)}>
      <FormattedDate value={date} />
    </span>
  );
};

export default FunctionComponent;
```

To keep the API surface clean and simple, we only provide `useIntl` hook in the package. If preferable, user can wrap this built-in hook to make customized hook like `useFormatMessage` easily. Please visit React's official website for more general [introduction on React hooks](https://reactjs.org/docs/hooks-intro.html).

### `injectIntl` HOC

```ts
type WrappedComponentProps<IntlPropName extends string = 'intl'> = {
  [k in IntlPropName]: IntlShape;
};

type WithIntlProps<P> = Omit<P, keyof WrappedComponentProps> & {
  forwardedRef?: React.Ref<any>;
};

function injectIntl<
  IntlPropName extends string = 'intl',
  P extends WrappedComponentProps<IntlPropName> = WrappedComponentProps<any>
>(
  WrappedComponent: React.ComponentType<P>,
  options?: Opts<IntlPropName>
): React.ComponentType<WithIntlProps<P>> & {
  WrappedComponent: typeof WrappedComponent;
};
```

This function is exported by the `react-intl` package and is a High-Order Component (HOC) factory. It will wrap the passed-in React component with another React component which provides the imperative formatting API into the wrapped component via its `props`. (This is similar to the connect-to-stores pattern found in many Flux implementations.)

By default, the formatting API will be provided to the wrapped component via `props.intl`, but this can be overridden when specifying `options.intlPropName`. The value of the prop will be of type [`IntlShape`](#Intlshape), defined in the next section.

```tsx
import React, {PropTypes} from 'react';
import {injectIntl, FormattedDate} from 'react-intl';

interface Props {
  date: Date | number;
}

const ClassComponent: React.FC<Props> = props => {
  const {
    date,
    intl, // Injected by `injectIntl`
  } = props;
  return (
    <span title={intl.formatDate(date)}>
      <FormattedDate value={date} />
    </span>
  );
};

export default injectIntl(ClassComponent);
```

### `IntlShape`

```ts
interface IntlConfig {
  locale: string;
  timeZone?: string;
  formats: CustomFormats;
  textComponent?: React.ComponentType | keyof React.ReactHTML;
  messages: Record<string, string> | Record<string, MessageFormatElement[]>;
  defaultLocale: string;
  defaultFormats: CustomFormats;
  onError(err: string): void;
}

interface IntlFormatters {
  formatDate(value: number | Date, opts: FormatDateOptions): string;
  formatTime(value: number | Date, opts: FormatDateOptions): string;
  formatRelativeTime(
    value: number,
    unit: Unit,
    opts: FormatRelativeOptions
  ): string;
  formatNumber(value: number, opts: FormatNumberOptions): string;
  formatPlural(value: number, opts: FormatPluralOptions): string;
  formatMessage(descriptor: MessageDescriptor, values: any): string;
}

type IntlShape = IntlConfig & IntlFormatters;
```

This interface is exported by the `react-intl` package that can be used in conjunction with the [`injectIntl`](#injectintl) HOC factory function.

The definition above shows what the `props.intl` object will look like that's injected to your component via `injectIntl`. It's made up of three parts:

- **`IntlConfig`:** The intl metadata passed as props into the parent `<IntlProvider>`.
- **`IntlFormatters`:** The imperative formatting API described below.

### `createIntl`

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

## Date Formatting APIs

React Intl provides three functions to format dates:

- [`formatDate`](#formatdate)
- [`formatTime`](#formattime)
- [`formatRelativeTime`](#formatrelativetime)

These APIs are used by their corresponding [`<FormattedDate>`](./Components.md#formatteddate), [`<FormattedTime>`](./Components.md#formattedtime), and [`<FormattedRelativeTime>`](./Components.md#formattedrelative) components and can be [injected](#injectintl) into your component via its `props`.

Each of these APIs support custom named formats via their `format` option which can be specified on `<IntlProvider>`. Both `formatDate` and `formatTime` use [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) options

**See:** The [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) docs for details on each of these options.

### `formatDate`

```tsx
function formatDate(
  value: number | Date,
  options?: Intl.DateTimeFormatOptions & {format?: string}
): string;
```

This function will return a formatted date string. It expects a `value` which can be parsed as a date (i.e., `isFinite(new Date(value))`), and accepts `options` that conform to `DateTimeFormatOptions`.

```tsx
formatDate(Date.now(), {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
}); // "3/4/2016"
```

### `formatTime`

```tsx
function formatTime(
  value: number | Date,
  options?: Intl.DateTimeFormatOptions & {format?: string}
): string;
```

This function will return a formatted date string, but it differs from [`formatDate`](#formatdate) by having the following default options:

```tsx
{
    hour: 'numeric',
    minute: 'numeric',
}
```

It expects a `value` which can be parsed as a date (i.e., `isFinite(new Date(value))`), and accepts `options` that conform to `DateTimeFormatOptions`.

```tsx
formatTime(Date.now()); // "4:03 PM"
```

### `formatRelativeTime`

```tsx
type Unit =
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year';

type RelativeTimeFormatOptions = {
  numeric?: 'always' | 'auto';
  style?: 'long' | 'short' | 'narrow';
};

function formatRelativeTime(
  value: number,
  unit: Unit,
  options?: Intl.RelativeTimeFormatOptions & {
    format?: string;
  }
): string;
```

This function will return a formatted relative time string (e.g., "1 hour ago"). It expects a `value` which is a number, a `unit` and `options` that conform to `Intl.RelativeTimeFormatOptions`.

```tsx
formatRelativeTime(0); // "now"
formatRelativeTime(-1); // "1 second ago"
formatRelativeTime(1, 'hour'); // "in 1 hour"
formatRelativeTime(-1, 'day', {numeric: 'auto'}); // "yesterday"
formatRelativeTime(-1, 'day'); // "1 day ago"
formatRelativeTime(-24, 'hour'); // "24 hours ago"
formatRelativeTime(-24, 'hour', {style: 'narrow'}); // "24 hr. ago"
```

## Number Formatting APIs

React Intl provides two functions to format numbers:

- [`formatNumber`](#formatnumber)
- [`formatPlural`](#formatplural)

These APIs are used by their corresponding [`<FormattedNumber>`](./Components.md#formattednumber), and [`<FormattedPlural>`](./Components.md#formattedplural) components and can be [injected](#injectintl) into your component via its `props`.

### `formatNumber`

This function uses [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat) options.

```ts
function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions & {format?: string}
): string;
```

This function will return a formatted number string. It expects a `value` which can be parsed as a number, and accepts `options` that conform to `NumberFormatOptions`.

```tsx
formatNumber(1000); // "1,000"
formatNumber(0.5, {style: 'percent'}); // "50%"
formatNumber(1000, {style: 'currency', currency: 'USD'}); // $1,000
```

**Formatting Number using `unit`**

Currently this is part of [Unified NumberFormat](https://github.com/tc39/proposal-unified-intl-numberformat) which is stage 3. We've provided a polyfill [here](https://github.com/formatjs/formatjs/tree/master/packages/intl-unified-numberformat) and `react-intl` types allow users to pass in a [sanctioned unit](https://github.com/formatjs/formatjs/tree/master/packages/intl-unified-numberformat):

```tsx
formatNumber(1000, {
  style: 'unit',
  unit: 'kilobyte',
  unitDisplay: 'narrow',
}); // "1,000kB"

formatNumber(1000, {
  unit: 'fahrenheit',
  unitDisplay: 'long',
  style: 'unit',
}); // "1,000 degrees Fahrenheit"
```

### `formatPlural`

```ts
type PluralFormatOptions = {
  type?: 'cardinal' | 'ordinal' = 'cardinal';
};

function formatPlural(
  value: number,
  options?: Intl.PluralFormatOptions
): 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
```

This function will return a plural category string: `"zero"`, `"one"`, `"two"`, `"few"`, `"many"`, or `"other"`. It expects a `value` which can be parsed as a number, and accepts `options` that conform to `PluralFormatOptions`.

This is a low-level utility whose output could be provided to a `switch` statement to select a particular string to display.

```tsx
formatPlural(0); // "other"
formatPlural(1); // "one"
formatPlural(2); // "other"
formatPlural(2, {style: 'ordinal'}); // "two"
formatPlural(3, {style: 'ordinal'}); // "few"
formatPlural(4, {style: 'ordinal'}); // "other"
```

**Note:** This function should only be used in apps that only need to support one language. If your app supports multiple languages use [`formatMessage`](#formatmessage) instead.

## List Formatting APIs

**This is currently stage 3 so [polyfill](https://www.npmjs.com/package/@formatjs/intl-listformat) would be required.**

### `formatList`

```ts
type ListFormatOptions = {
  type?: 'disjunction' | 'conjunction' | 'unit';
  style?: 'long' | 'short' | 'narrow';
};

function formatList(
  elements: (string | React.ReactNode)[],
  options?: Intl.ListFormatOptions
): string | React.ReactNode[];
```

This function allows you to join list of things together in an i18n-safe way. For example, when the locale is `en`:

```tsx
formatList(['Me', 'myself', 'I'], {type: 'conjunction'}); // Me, myself, and I
formatList(['5 hours', '3 minutes'], {type: 'unit'}); // 5 hours, 3 minutes
```

## Message Formatting APIs

### Message Syntax

String/Message formatting is a paramount feature of React Intl and it builds on [ICU Message Formatting](http://userguide.icu-project.org/formatparse/messages) by using the [ICU Message Syntax](../icu-syntax.md). This message syntax allows for simple to complex messages to be defined, translated, and then formatted at runtime.

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

**See:** The [Message Syntax Guide](../icu-syntax.md).

### Message Descriptor

React Intl has a Message Descriptor concept which is used to define your app's default messages/strings and is passed into `formatMessage`. The Message Descriptors work very well for providing the data necessary for having the strings/messages translated, and they contain the following properties:

- **`id`:** A unique, stable identifier for the message
- **`description`:** Context for the translator about how it's used in the UI
- **`defaultMessage`:** The default message (probably in English)

```tsx
type MessageDescriptor = {
  id: string;
  defaultMessage?: string;
  description?: string | object;
};
```

**Note:** The [babel-plugin-react-intl](https://github.com/formatjs/formatjs/tree/master/packages/babel-plugin-react-intl) package can be used to extract Message Descriptors defined in JavaScript source files.

### Message Formatting Fallbacks

The message formatting APIs go the extra mile to provide fallbacks for the common situations where formatting fails; at the very least a non-empty string should always be returned. Here's the message formatting fallback algorithm:

1. Lookup and format the translated message at `id`, passed to `<IntlProvider>`.
2. Fallback to formatting the `defaultMessage`.
3. Fallback to source of translated message at `id`.
4. Fallback to source of `defaultMessage`.
5. Fallback to the literal message `id`.

Above, "source" refers to using the template as is, without any substitutions made.

### `formatMessage`

```ts
type MessageFormatPrimitiveValue = string | number | boolean | null | undefined;
function formatMessage(
  descriptor: MessageDescriptor,
  values?: Record<string, MessageFormatPrimitiveValue>
): string;
function formatMessage(
  descriptor: MessageDescriptor,
  values?: Record<
    string,
    MessageFormatPrimitiveValue | React.ReactElement | FormatXMLElementFn
  >
): string | React.ReactNodeArray;
```

This function will return a formatted message string. It expects a `MessageDescriptor` with at least an `id` property, and accepts a shallow `values` object which are used to fill placeholders in the message.

If a translated message with the `id` has been passed to the `<IntlProvider>` via its `messages` prop it will be formatted, otherwise it will fallback to formatting `defaultMessage`. See: [Message Formatting Fallbacks](#message-formatting-fallbacks) for more details.

```tsx
const messages = defineMessages({
  greeting: {
    id: 'app.greeting',
    defaultMessage: 'Hello, {name}!',
    description: 'Greeting to welcome the user to the app',
  },
});

formatMessage(messages.greeting, {name: 'Eric'}); // "Hello, Eric!"
```

with `ReactElement`

```tsx
const messages = defineMessages({
  greeting: {
    id: 'app.greeting',
    defaultMessage: 'Hello, {name}!',
    description: 'Greeting to welcome the user to the app',
  },
});

formatMessage(messages.greeting, {name: <b>Eric</b>}); // ['Hello, ', <b>Eric</b>, '!']
```

with rich text formatting

```tsx
const messages = defineMessages({
  greeting: {
    id: 'app.greeting',
    defaultMessage: 'Hello, <bold>{name}</bold>!',
    description: 'Greeting to welcome the user to the app',
  },
});

formatMessage(messages.greeting, {
  name: 'Eric',
  bold: str => <b>{str}</b>,
}); // ['Hello, ', <b>Eric</b>, '!']
```

The message we defined using [`defineMessages`](#definemessages) to support extraction via `babel-plugin-react-intl`, but it doesn't have to be if you're not using the Babel plugin.

**Note:** Messages can be simple strings _without_ placeholders, and that's the most common type of message.

### `formatDisplayName`

```ts
type FormatDisplayNameOptions = {
  style?: 'narrow' | 'short' | 'long';
  type?: 'language' | 'region' | 'script' | 'currency';
  fallback?: 'code' | 'none';
};

function formatDisplayName(
  value: string | number | object,
  options?: FormatDisplayNameOptions
): string | undefined;
```

Usage examples:

```ts
// When locale is `en`
formatDisplayName('zh-Hans-SG'); //=> Simplified Chinese (Singapore)
// When locale is `zh`
formatDisplayName('zh-Hans-SG'); //=> 简体中文（新加坡）

// When locale is `en`...
// ISO-15924 four letters script code to localized display name
formatDisplayName('Deva', {type: 'script'}); //=> Devanagari
// ISO-4217 currency code to localized display name
formatDisplayName('CNY', {type: 'currency'}); //=> Chinese Yuan
// ISO-3166 two letters region code to localized display name
formatDisplayName('UN', {type: 'region'}); //=> United Nations
```
