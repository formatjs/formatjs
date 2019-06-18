# API

There are a few API layers that React Intl provides and is built on. When using React Intl you'll be interacting with its API (documented here) and its React [components][components].

1. [ECMAScript Internationalization API](#ecmascript-internationalization-api)
2. [FormatJS Internationalization Formatters](#formatjs-internationalization-formatters)
3. [React Intl API](#react-intl-api)
   - [Locale Data APIs](#locale-data-apis)
   - [Injection API](#injection-api)
   - [Date Formatting APIs](#date-formatting-apis)
   - [Number Formatting APIs](#number-formatting-apis)
   - [String Formatting APIs](#string-formatting-apis)
4. [React Intl Components](#react-intl-components)

## ECMAScript Internationalization API

**React Intl uses and builds on the [Internationalization API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) built-in to JavaScript.**

Specifically, the built-in API is used to format dates/times and numbers in React Intl. It's good to familiarize yourself with the following APIs, **especially their `options`:**

- [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat)
- [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat)
- [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules)
- [`Intl.RelativeTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat)

React Intl wraps these APIs in a consistent way making them easier to use, more performant through memoization, and gracefully fallsback when they throw errors.

## FormatJS Internationalization Formatters

Beyond number and date formatting, React Intl provides relative time and string/message formatting. These formatters are part of the [FormatJS](http://formatjs.io/) project, which React Intl is also a part of. These formatters were developed in the same style as the built-in formatters.

- [`IntlMessageFormat`](https://github.com/formatjs/formatjs/tree/master/packages/intl-messageformat)
- [`IntlRelativeFormat`](https://github.com/formatjs/formatjs/tree/master/packages/intl-relativeformat)

React Intl wraps these APIs in the same way it wraps the built-in Intl APIs.

## React Intl API

#### `defineMessages`

```ts
interface MessageDescriptor {
  id: string;
  description?: string | object;
  defaultMessage?: string;
}

function defineMessages(
  messageDescriptors: Record<string, MessageDescriptor>
): Record<string, MessageDescriptor>;
```

This function is exported by the `react-intl` package and is simply a _hook_ for the [babel-plugin-react-intl](https://github.com/formatjs/formatjs/tree/master/packages/babel-plugin-react-intl) package to use when extracting default messages defined in JavaScript source files. This function simply returns the Message Descriptor map object that's passed-in.

```ts
import {defineMessages} from 'react-intl';

const messages = defineMessages({
  greeting: {
    id: 'app.home.greeting',
    description: 'Message to greet the user.',
    defaultMessage: 'Hello, {name}!',
  },
});
```

### Injection API

React Intl provides:

1. [`useIntl` hook](#useintl-hook): to _hook_ the imperative formatting API into a React function component (with React version >= 16.8).
2. [`withIntl` HOC](#withintl-hoc): to _inject_ the imperative formatting API into a React class or function component via its `props`.

These should be used when your React component needs to format data to a string value where a React element is not suitable; e.g., a `title` or `aria` attribute, or for side-effect in `componentDidMount`.

#### `useIntl` hook

If a component can be expressed in a form of function component, using `useIntl` HOC can be handy. This `useIntl` hook do not expect any option as its argument when being called. Typically, here is how you would like to use:

```tsx
import React from 'react';
import {useIntl, FormattedRelative} from 'react-intl';

const FunctionComponent: React.FC<{date: number | Date}> = ({date}) => {
  const intl = useIntl();
  return (
    <span title={intl.formatDate(date)}>
      <FormattedRelative value={date} />
    </span>
  );
};

export default FunctionComponent;
```

To keep the API surface clean and simple, we only provide `useIntl` hook in the package. If preferable, user can wrap this built-in hook to make customized hook like `useFormatMessage` easily. Please visit React's official website for more general [introduction on React hooks](https://reactjs.org/docs/hooks-intro.html).

#### `withIntl` HOC

```ts
type WrappedComponentProps<IntlPropName extends string = 'intl'> = {
  [k in IntlPropName]: IntlShape;
};

type WithIntlProps<P> = Omit<P, keyof WrappedComponentProps> & {
  forwardedRef?: React.Ref<any>;
};

function withIntl<
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
import {withIntl, FormattedRelative} from 'react-intl';

interface Props {
  date: Date | number;
}

const ClassComponent: React.FC<Props> = props => {
  const {
    date,
    intl, // Injected by `withIntl`
  } = props;
  return (
    <span title={intl.formatDate(date)}>
      <FormattedRelative value={date} />
    </span>
  );
};

export default withIntl(ClassComponent);
```

#### `IntlShape`

```ts
interface IntlConfig {
  locale?: string;
  timeZone?: string;
  formats?: CustomFormats;
  textComponent?: any;
  messages?: Record<string, string>;
  defaultLocale: string;
  defaultFormats?: CustomFormats;
  onError?(err: string): void;
}

interface IntlFormatters {
  formatDate(value: number | Date, opts: FormatDateOptions): string;
  formatTime(value: number | Date, opts: FormatDateOptions): string;
  formatRelative(value: number, opts: FormatRelativeOptions): string;
  formatNumber(value: number, opts: FormatNumberOptions): string;
  formatPlural(value: number, opts: FormatPluralOptions): string;
  formatMessage(descriptor: MessageDescriptor, values: any): string;
  formatHTMLMessage: Function;
}

interface IntlShape extends IntlConfig, IntlFormatters {
  now(): number;
}
```

This interface is exported by the `react-intl` package that can be used in conjunction with the [`withIntl`](#withintl) HOC factory function.

The definition above shows what the `props.intl` object will look like that's injected to your component via `withIntl`. It's made up of three parts:

- **`IntlConfig`:** The intl metadata passed as props into the parent `<IntlProvider>`.
- **`IntlFormatters`:** The imperative formatting API described below.
- **`now`:** A function that returns the current time.

### Date Formatting APIs

React Intl provides three functions to format dates:

- [`formatDate`](#formatdate)
- [`formatTime`](#formattime)
- [`formatRelative`](#formatrelative)

These APIs are used by their corresponding [`<FormattedDate>`](./Components.md#formatteddate), [`<FormattedTime>`](./Components.md#formattedtime), and [`<FormattedRelative>`](./Components.md#formattedrelative) components and can be [injected](#withintl) into your component via its `props`.

Each of these APIs support custom named formats via their `format` option which can be specified on `<IntlProvider>`. Both `formatDate` and `formatTime` use [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) options

**See:** The [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) docs for details on each of these options.

#### `formatDate`

```js
function formatDate(
    value: number | Date,
    options?: Intl.DateTimeFormatOptions & {format?: string}
): string;
```

This function will return a formatted date string. It expects a `value` which can be parsed as a date (i.e., `isFinite(new Date(value))`), and accepts `options` that conform to `DateTimeFormatOptions`.

```js
formatDate(Date.now(), {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
}); // "3/4/2016"
```

#### `formatTime`

```js
function formatTime(
    value: number | Date,
    options?: Intl.DateTimeFormatOptions & {format?: string}
): string;
```

This function will return a formatted date string, but it differs from [`formatDate`](#formatdate) by having the following default options:

```js
{
    hour: 'numeric',
    minute: 'numeric',
}
```

It expects a `value` which can be parsed as a date (i.e., `isFinite(new Date(value))`), and accepts `options` that conform to `DateTimeFormatOptions`.

```js
formatTime(Date.now()); // "4:03 PM"
```

#### `formatRelative`

```js
type RelativeFormatOptions = {
    style?: 'best fit' | 'numeric' = 'best fit',
    units?:
      'second' |
      'second-short' |
      'second-narrow' |
      'minute' |
      'minute-short' |
      'minute-narrow' |
      'hour' |
      'hour-short' |
      'hour-narrow' |
      'day' |
      'day-short' |
      'day-narrow' |
      'week' |
      'week-short' |
      'week-narrow' |
      'month' |
      'month-short' |
      'month-narrow' |
      'year' |
      'year-short'|
      'year-narrow',
};

function formatRelative(
    value: number | Date,
    options?: RelativeFormatOptions & {
        format?: string,
        now?: number
    }
): string;
```

This function will return a formatted relative time string (e.g., "1 hour ago"). It expects a `value` which can be parsed as a date (i.e., `isFinite(new Date(value))`), and accepts `options` that conform to `RelativeFormatOptions`.

```js
const now = Date.now();
formatRelative(now); // "now"
formatRelative(now - 1000); // "1 second ago"
formatRelative(now + 1000 * 60 * 60); // "in 1 hour"
formatRelative(now - 1000 * 60 * 60 * 24); // "yesterday"
formatRelative(now - 1000 * 60 * 60 * 24, {style: 'numeric'}); // "1 day ago"
formatRelative(now - 1000 * 60 * 60 * 24, {units: 'hour'}); // "24 hours ago"
formatRelative(now - 1000 * 60 * 60 * 24, {units: 'hour-narrow'}); // "24 hr. ago"
```

By default, the `value` is compared with the current time at the time the function is called, but this reference time value can be explicitly specified via the `now` option.

**Note:** The reason [`IntlShape`](#Intlshape) has a `now` function is to allow both `<IntlProvider>` and `<FormattedRelative>` components to provide an `initialNow` prop. This allows for the current time to be fixed for things like testing or server-side rendering in an isomorphic/universal React app.

### Number Formatting APIs

React Intl provides two functions to format numbers:

- [`formatNumber`](#formatnumber)
- [`formatPlural`](#formatplural)

These APIs are used by their corresponding [`<FormattedNumber>`](./Components.md#formattednumber), and [`<FormattedPlural>`](./Components.md#formattedplural) components and can be [injected](#withintl) into your component via its `props`.

#### `formatNumber`

This function uses [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat) options.

```ts
function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions & {format?: string}
): string;
```

This function will return a formatted number string. It expects a `value` which can be parsed as a number, and accepts `options` that conform to `NumberFormatOptions`.

```js
formatNumber(1000); // "1,000"
formatNumber(0.5, {style: 'percent'}); // "50%"
formatNumber(1000, {style: 'currency', currency: 'USD'}); // $1,000
```

#### `formatPlural`

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

```js
formatPlural(0); // "other"
formatPlural(1); // "one"
formatPlural(2); // "other"
formatPlural(2, {style: 'ordinal'}); // "two"
formatPlural(3, {style: 'ordinal'}); // "few"
formatPlural(4, {style: 'ordinal'}); // "other"
```

**Note:** This function should only be used in apps that only need to support one language. If your app supports multiple languages use [`formatMessage`](#formatmessage) instead.

### String Formatting APIs

React Intl provides two functions to format strings/messages:

- [`formatMessage`](#formatmessage)
- [`formatHTMLMessage`](#formathtmlmessage)

These APIs are used by their corresponding `<FormattedMessage>`, and `<FormattedHTMLMessage>` components and can be [injected](#withintl) into your component via its `props`.

#### Message Syntax

String/Message formatting is a paramount feature of React Intl and it builds on [ICU Message Formatting](http://userguide.icu-project.org/formatparse/messages) by using the [ICU Message Syntax](http://formatjs.io/guides/message-syntax/). This message syntax allows for simple to complex messages to be defined, translated, and then formatted at runtime.

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

**See:** The [Message Syntax Guide](http://formatjs.io/guides/message-syntax/) on the [FormatJS website](http://formatjs.io/).

#### Message Descriptor

React Intl has a Message Descriptor concept which is used to define your app's default messages/strings and is passed into `formatMessage` and `formatHTMLMessage`. The Message Descriptors work very well for providing the data necessary for having the strings/messages translated, and they contain the following properties:

- **`id`:** A unique, stable identifier for the message
- **`description`:** Context for the translator about how it's used in the UI
- **`defaultMessage`:** The default message (probably in English)

```js
type MessageDescriptor = {
  id: string,
  defaultMessage?: string,
  description?: string | object,
};
```

**Note:** The [babel-plugin-react-intl](https://github.com/formatjs/formatjs/tree/master/packages/babel-plugin-react-intl) package can be used to extract Message Descriptors defined in JavaScript source files.

#### Message Formatting Fallbacks

The message formatting APIs go the extra mile to provide fallbacks for the common situations where formatting fails; at the very least a non-empty string should always be returned. Here's the message formatting fallback algorithm:

1. Lookup and format the translated message at `id`, passed to `<IntlProvider>`.
2. Fallback to formatting the `defaultMessage`.
3. Fallback to source of translated message at `id`.
4. Fallback to source of `defaultMessage`.
5. Fallback to the literal message `id`.

Above, "source" refers to using the template as is, without any substitutions made.

#### `formatMessage`

```js
function formatMessage(
    messageDescriptor: MessageDescriptor,
    values?: object
): string;
```

This function will return a formatted message string. It expects a `MessageDescriptor` with at least an `id` property, and accepts a shallow `values` object which are used to fill placeholders in the message.

If a translated message with the `id` has been passed to the `<IntlProvider>` via its `messages` prop it will be formatted, otherwise it will fallback to formatting `defaultMessage`. See: [Message Formatting Fallbacks](#message-formatting-fallbacks) for more details.

```js
const messages = defineMessages({
  greeting: {
    id: 'app.greeting',
    defaultMessage: 'Hello, {name}!',
    description: 'Greeting to welcome the user to the app',
  },
});

formatMessage(messages.greeting, {name: 'Eric'}); // "Hello, Eric!"
```

The message we defined using [`defineMessages`](#definemessages) to support extraction via `babel-plugin-react-intl`, but it doesn't have to be if you're not using the Babel plugin.

**Note:** Messages can be simple strings _without_ placeholders, and that's the most common type of message.

#### `formatHTMLMessage`

```js
function formatHTMLMessage(
    messageDescriptor: MessageDescriptor,
    values?: object
): string;
```

**Note:** This API is provided to format legacy string message that contain HTML, but is not recommended, use [`<FormattedMessage>`](./Components.md#formattedmessage) instead.

## React Intl Components

The React components provided by React Intl allow for a declarative, idiomatic-React way of providing internationalization configuration and format dates, numbers, and strings/messages in your app.

**See:** The [Components][components] page.

[components]: Components.md
