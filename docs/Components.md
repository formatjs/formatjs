# Components

React Intl has a set of React components that provide a declarative way to setup an i18n context and format dates, numbers, and strings for display in a web UI. The components render React elements by building on React Intl's imperative [API](./API.md).

<!-- toc -->

- [Why Components?](#why-components)
- [Intl Provider Component](#intl-provider-component)
  - [`IntlProvider`](#intlprovider)
  - [`RawIntlProvider`](#rawintlprovider)
    - [Dynamic Language Selection](#dynamic-language-selection)
- [Date Formatting Components](#date-formatting-components)
  - [`FormattedDate`](#formatteddate)
  - [`FormattedTime`](#formattedtime)
  - [`FormattedRelativeTime`](#formattedrelativetime)
- [Number Formatting Components](#number-formatting-components)
  - [`FormattedNumber`](#formattednumber)
  - [`FormattedPlural`](#formattedplural)
- [String Formatting Components](#string-formatting-components)
  - [Message Syntax](#message-syntax)
  - [Message Descriptor](#message-descriptor)
  - [Message Formatting Fallbacks](#message-formatting-fallbacks)
  - [`FormattedMessage`](#formattedmessage)
    - [Rich Text Formatting](#rich-text-formatting)
  - [`FormattedHTMLMessage`](#formattedhtmlmessage)
  - [Using React-Intl with React Native](#using-react-intl-with-react-native)

<!-- tocstop -->

## Why Components?

Beyond providing an idiomatic-React way of integrating internationalization into a React app, and the `<Formatted*>` components have benefits over always using the imperative API directly:

- Render React elements that seamlessly compose with other React components.
- Support rich-text string/message formatting in `<FormattedMessage>`.
- Implement advanced features like `<FormattedRelativeTime>`'s updating over time.
- Provide TypeScript type definitions.

## Intl Provider Component

React Intl uses the provider pattern to scope an i18n context to a tree of components. This allows configuration like the current locale and set of translated strings/messages to be provided at the root of a component tree and made available to the `<Formatted*>` components. This is the same concept as what Flux frameworks like [Redux](http://redux.js.org/) use to provide access to a store within a component tree.

**All apps using React Intl must use the `<IntlProvider>` component.**

### `IntlProvider`

This component is used to setup the i18n context for a tree. Usually, this component will wrap an app's root component so that the entire app will be within the configured i18n context. The following are the i18n configuration props that can be set:

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
```

`locale`, `formats`, and `messages` are for the user's current locale and what the app should be rendered in. While `defaultLocale` and `defaultFormats` are for fallbacks or during development and represent the app's default. Notice how there is no `defaultMessages`, that's because each [Message Descriptor](#message-descriptor) provides a `defaultMessage`.

`textComponent` provides a way to configure the default wrapper for React Intl's `<Formatted*>` components. If not specified, [<React.Fragment>](https://reactjs.org/docs/fragments.html) is used. Before V3, `span` was used instead; check the [migration guide](https://github.com/formatjs/react-intl/blob/core/docs/Upgrade-Guide.md) for more info.

`onError` allows the user to provide a custom error handler. By default, error messages are logged using `console.error` if `NODE_ENV` is not set to `production`.

These configuration props are combined with the `<IntlProvider>`'s component-specific props:

**Props:**

```js
props: IntlConfig &
  {
    children: ReactNode,
  };
```

Finally, child elements _must_ be supplied to `<IntlProvider>`.

**Example:**

```js
const App = ({importantDate}) => (
  <div>
    <FormattedDate
      value={importantDate}
      year="numeric"
      month="long"
      day="numeric"
      weekday="long"
    />
  </div>
);

ReactDOM.render(
  <IntlProvider locale={navigator.language}>
    <App importantDate={new Date(1459913574887)} />
  </IntlProvider>,
  document.getElementById('container')
);
```

Assuming `navigator.language` is `"fr"`:

```html
<div><span>mardi 5 avril 2016</span></div>
```

### `RawIntlProvider`

This is the underlying `React.Context.Provider` object that `IntlProvider` use. It can be used in conjunction with `createIntl`:

```tsx
import {createIntl, createIntlCache, RawIntlProvider} from 'react-intl'

// This is optional but highly recommended
// since it prevents memory leak
const cache = createIntlCache()

const intl = createIntl({
  locale: 'fr-FR',
  messages: {}
}, cache)

// Pass it to IntlProvider
<RawIntlProvider value={intl}>{foo}</RawIntlProvider>
```

#### Dynamic Language Selection

By default, changes to the `locale` at runtime may not trigger a re-render of child elements. To solve this, and enable dynamic locale modification, add a `key` property to the `<IntlProvider>` and set it to the locale, which persuades React that the component has been modified:

```js
<IntlProvider locale={localeProp} key={localeProp} messages={messagesProp}>
  <App />
</IntlProvider>
```

(See [Issue #243](https://github.com/formatjs/react-intl/issues/243).)

## Date Formatting Components

React Intl provides three components to format dates:

- [`<FormattedDate>`](#formatteddate)
- [`<FormattedTime>`](#formattedtime)
- [`<FormattedRelativeTime>`](#formattedrelativetime)

Both `<FormattedDate>` and `<FormattedTime>` use [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) options.

### `FormattedDate`

This component uses the [`formatDate`](API.md#formatdate) and [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) APIs and has `props` that correspond to the `DateTimeFormatOptions` specified above.

**Props:**

```ts
props: Intl.DateTimeFormatOptions &
  {
    value: any,
    format: string,
    children: (formattedDate: string) => ReactElement,
  };
```

By default `<FormattedDate>` will render the formatted date into a `<React.Fragment>`. If you need to customize rendering, you can either wrap it with another React element (recommended), or pass a function as the child.

**Example:**

```js
<FormattedDate value={new Date(1459832991883)} />
```

```html
<span>4/5/2016</span>
```

**Example with Options:**

```js
<FormattedDate
  value={new Date(1459832991883)}
  year="numeric"
  month="long"
  day="2-digit"
/>
```

```html
<span>April 05, 2016</span>
```

### `FormattedTime`

This component uses the [`formatTime`](API.md#formattime) and [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) APIs and has `props` that correspond to the `DateTimeFormatOptions` specified above, with the following defaults:

```js
{
    hour: 'numeric',
    minute: 'numeric',
}
```

**Props:**

```js
props: DateTimeFormatOptions & {
    value: any,
    format?: string,
    children?: (formattedDate: string) => ReactElement,
}
```

By default `<FormattedTime>` will render the formatted time into a `<span>`. If you need to customize rendering, you can either wrap it with another React element (recommended), or pass a function as the child.

**Example:**

```js
<FormattedTime value={new Date(1459832991883)} />
```

```html
<span>1:09 AM</span>
```

### `FormattedRelativeTime`

This component uses the [`formatRelativeTime`](API.md#formatrelativetime) API and has `props` that correspond to the following relative formatting options:

```ts
type RelativeTimeFormatOptions = {
  numeric?: 'always' | 'auto';
  style?: 'long' | 'short' | 'narrow';
};
```

**Prop Types:**

```ts
props: RelativeTimeFormatOptions &
  {
    value: number,
    unit: Unit,
    format: string,
    updateIntervalInSeconds: number,
    children: (formattedDate: string) => ReactElement,
  };
```

By default `<FormattedRelativeTime>` will render the formatted relative time into a `<>`. If you need to customize rendering, you can either wrap it with another React element (recommended), or pass a function as the child.

**Example:**

```tsx
<FormattedRelativeTime value={0} />
```

```html
now
```

…10 seconds later:

```html
10 seconds ago
```

…60 seconds later:

```html
1 minute ago
```

**Note:** You can adjust the maximum interval that the component will re-render by setting the `updateIntervalInSeconds`. A falsy value will turn off auto-updating. The updating is smart and will schedule the next update for the next _interesting moment_.

An _interesting moment_ is defined as the next non-fractional `value` for that `unit`. For example:

```tsx
<FormattedRelativeTime value={-59} updateIntervalInSeconds={1} />
```

This will initially renders `59 seconds ago`, after 1 second, will render `1 minute ago`, and will not re-render until a full minute goes by, it'll render `2 minutes ago`. It will not try to render `1.2 minutes ago`.

**Note:** `updateIntervalInSeconds` cannot be enabled for `unit` longer than `hour` (so not for `day`, `week`, `quarter`, `year`). This is primarily because it doesn't make sense to schedule a timeout in `day`s, and the number of `ms` in a day is larger than the max timeout that `setTimeout` accepts.

## Number Formatting Components

React Intl provides two components to format numbers:

- [`<FormattedNumber>`](#formattednumber)
- [`<FormattedPlural>`](#formattedplural)

### `FormattedNumber`

This component uses the [`formatNumber`](API.md#formatnumber) and [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat) APIs and has `props` that correspond to `Intl.NumberFormatOptions`.

**Props:**

```ts
props: NumberFormatOptions &
  {
    value: number,
    format: string,
    children: (formattedNumber: string) => ReactElement,
  };
```

By default `<FormattedNumber>` will render the formatted number into a `<span>`. If you need to customize rendering, you can either wrap it with another React element (recommended), or pass a function as the child.

**Example:**

```tsx
<FormattedNumber value={1000} />
```

```tsx
<span>1,000</span>
```

### `FormattedPlural`

This component uses the [`formatPlural`](API.md#formatplural) API and [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules) has `props` that correspond to `Intl.PluralRulesOptions`.

**Props:**

```ts
props: PluralFormatOptions &
  {
    value: any,

    other: ReactElement,
    zero: ReactElement,
    one: ReactElement,
    two: ReactElement,
    few: ReactElement,
    many: ReactElement,

    children: (formattedPlural: ReactElement) => ReactElement,
  };
```

By default `<FormattedPlural>` will select a [plural category](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) (`zero`, `one`, `two`, `few`, `many`, or `other`) and render the corresponding React element into a `<span>`. If you need to customize rendering, you can either wrap it with another React element (recommended), or pass a function as the child.

**Example:**

```js
<FormattedPlural value={10} one="message" other="messages" />
```

```html
<span>messages</span>
```

## String Formatting Components

React Intl provides two components to format strings:

- [`<FormattedMessage>`](#formattedmessage)
- [`<FormattedHTMLMessage>`](#formattedhtmlmessage)

It is recommended that you use `<FormattedMessage>` because it provides greater rich-text formatting features while also being more performant. `<FormattedHTMLMessage>` is provided for apps that have legacy external strings which contain HTML.

### Message Syntax

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

### Message Descriptor

React Intl has a Message Descriptor concept which is used to define your app's default messages/strings. `<FormattedMessage>` and `<FormattedHTMLMessage>` have props which correspond to a Message Descriptor. The Message Descriptors work very well for providing the data necessary for having the strings/messages translated, and they contain the following properties:

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

A common practice is to use the [`defineMessages`](API.md#definemessages) API to define all of a component's strings, then _spread_ the Message Descriptor as props to the component.

**Note:** The [babel-plugin-react-intl](https://github.com/formatjs/formatjs/tree/master/packages/babel-plugin-react-intl) package can be used to extract Message Descriptors defined in JavaScript source files.

### Message Formatting Fallbacks

The message formatting APIs go the extra mile to provide fallbacks for the common situations where formatting fails; at the very least a non-empty string should always be returned. Here's the message formatting fallback algorithm:

1. Lookup and format the translated message at `id`, passed to [`<IntlProvider>`](#intlprovider).
2. Fallback to formatting the `defaultMessage`.
3. Fallback to translated message at `id`'s source.
4. Fallback to `defaultMessage` source.
5. Fallback to the literal message `id`.

### `FormattedMessage`

This component uses the [`formatMessage`](API.md#formatmessage) API and has `props` that correspond to a [Message Descriptor](#message-descriptor).

**Props:**

```js
props: MessageDescriptor & {
    values?: object,
    tagName?: string,
    children?: (...formattedMessage: Array<ReactElement>) => ReactElement,
}
```

By default `<FormattedMessage>` will render the formatted string into a `<React.Fragment>`. If you need to customize rendering, you can either wrap it with another React element (recommended), specify a different `tagName` (e.g., `'div'`), or pass a function as the child.

**Example:**

```js
<FormattedMessage
  id="app.greeting"
  description="Greeting to welcome the user to the app"
  defaultMessage="Hello, {name}!"
  values={{
    name: 'Eric',
  }}
/>
```

```html
<span>Hello, Eric!</span>
```

**Example:** function as the child

```js
<FormattedMessage id="title">{txt => <H1>{txt}</H1>}</FormattedMessage>
```

```html
<h1>Hello, Eric!</h1>
```

**Note:** Messages can be simple strings _without_ placeholders, and that's the most common type of message. This case is highly-optimized, but still has the benefits of the [fallback procedure](#message-formatting-fallbacks).

#### Rich Text Formatting

`<FormattedMessage>` also supports rich-text formatting by specifying a XML tag in the message & resolving that tag in the `values` prop. Here's an example:

```tsx
<FormattedMessage
  id="app.greeting"
  description="Greeting to welcome the user to the app"
  defaultMessage="Hello, <b>Eric</b> {icon}"
  values={{
    b: msg => <b>{msg}</b>,
    icon: <svg />,
  }}
/>
```

```html
<span>Hello, <b>Eric</b>!</span>
```

By allowing embedding XML tag we want to make sure contextual information is not lost when you need to style part of the string. In a more complicated example like:

```tsx
<FormattedMessage
  defaultMessage="To buy a shoe, <link>visit our website</link> and <cta>buy a shoe</cta>"
  values={{
    link: msg => (
      <a class="external_link" target="_blank" href="https://www.shoe.com/">
        {msg}
      </a>
    ),
    cta: msg => <strong class="important">{msg}</strong>,
  }}
/>
```

All the rich text gets translated together which yields higher quality output. This brings feature-parity with other translation libs as well, such as [fluent](https://projectfluent.org/) by Mozilla (using `overlays` concept).

Extending this also allows users to potentially utilizing other rich text format, like [Markdown](https://daringfireball.net/projects/markdown/).

### `FormattedHTMLMessage`

**Note:** This component is provided for apps that have legacy external strings which contain HTML, but is not recommended, use [`<FormattedMessage>`](#formattedmessage) instead, if you can.

This component uses the [`formatHTMLMessage`](API.md#formathtmlmessage) API and has the same props as `<FormattedMessage>`, but it will accept messages that contain HTML. In order to protect against XSS, all string `values` will be HTML-escaped and the resulting formatted message will be set via `dangerouslySetInnerHTML`. This means that `values` _cannot_ contain React element like `<FormattedMessage>` and this component will be less performant.

### Using React-Intl with React Native

Historically, it was required to provide a `textComponent` for React-Intl to work on React Native, because Fragments didn't exist at the time and React Native would break trying to render a `span` (the default `textComponent` in React-Intl V2).

Starting with [React Native v0.52](https://github.com/react-native-community/releases/blob/master/CHANGELOG.md#0520---2018-01-07), which uses [React v16.2+](https://reactjs.org/blog/2017/11/28/react-v16.2.0-fragment-support.html), Fragments are supported. And since React-Intl V3's default `textComponent` is `<React.Fragment>`, such requirement no longer exists.
