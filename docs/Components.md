# Components

React Intl has a set of React components that provide a declarative way to setup an i18n context and format dates, numbers, and strings for display in a web UI. The components render React elements by building on React Intl's imperative [API](API).

<!-- toc -->

- [Intl Provider Component](#intl-provider-component)
- [``](#)
  - [Multiple Intl Contexts](#multiple-intl-contexts)
  - [Dynamic Language Selection](#dynamic-language-selection)
- [Date Formatting Components](#date-formatting-components)
- [``](#)
- [``](#)
- [``](#)
- [Number Formatting Components](#number-formatting-components)
- [``](#)
- [``](#)
- [String Formatting Components](#string-formatting-components)
- [Message Syntax](#message-syntax)
- [Message Descriptor](#message-descriptor)
- [Message Formatting Fallbacks](#message-formatting-fallbacks)
- [``](#)
  - [Rich Text Formatting](#rich-text-formatting)
- [``](#)
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

### `<IntlProvider>`

This component is used to setup the i18n context for a tree. Usually, this component will wrap an app's root component so that the entire app will be within the configured i18n context. The following are the i18n configuration props that can be set:

```ts
interface IntlConfig {
  locale: string;
  timeZone?: string;
  formats: CustomFormats;
  textComponent: React.ComponentType | keyof React.ReactHTML;
  messages: Record<string, string>;
  defaultLocale: string;
  defaultFormats: CustomFormats;
  onError(err: string): void;
}
```

`locale`, `formats`, and `messages` are for the user's current locale and what the app should be rendered in. While `defaultLocale` and `defaultFormats` are for fallbacks or during development and represent the app's default. Notice how there is no `defaultMessages`, that's because each [Message Descriptor](#message-descriptor) provides a `defaultMessage`.

`textComponent` provides a way to configure React Intl to work with React Native. React Intl's `<Formatted*>` components are required to render React elements, by default they render `<span>` elements. However in React Native, there is no `<span>`, there's `<Text>`; therefore if you're using React Intl in React Native set: `<IntlProvider textComponent={Text}>`.

`onError` allows the user to provide a custom error handler. By default, error messages are logged using `console.error` if `NODE_ENV` is not set to `production`.

These configuration props are combined with the `<IntlProvider>`'s component-specific props:

**Props:**

```js
props: IntlConfig & {
    children: ReactElement,
    initialNow?: any,
}
```

`initialNow` should be set for universal/isomorphic apps. This value should be capture on the server before the app is rendered and transmitted to the client to use at its `initialNow` as well. This stabilizes the "current time" for the initial rendering of the app, which affects relative time formatting.

Finally, a **single child** element _must_ be supplied to `<IntlProvider>`.

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

#### Multiple Intl Contexts

Nested `<IntlProvider>` components can be used to provide a different, or modified i18n context to a subtree of the app. In these cases, the nested `<IntlProvider>` will inherit from its nearest ancestor `<IntlProvider>`. A nested strategy can be employed to provide a subset of translations to a subtree. See: [Nested Example app](https://github.com/formatjs/react-intl/tree/master/examples/nested)

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

### `<FormattedDate>`

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

By default `<FormattedDate>` will render the formatted date into a `<span>`. If you need to customize rendering, you can either wrap it with another React element (recommended), or pass a function as the child.

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

### `<FormattedTime>`

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

### `<FormattedRelativeTime>`

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

### `<FormattedNumber>`

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

### `<FormattedPlural>`

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

### `<FormattedMessage>`

This component uses the [`formatMessage`](API.md#formatmessage) API and has `props` that correspond to a [Message Descriptor](#message-descriptor).

**Props:**

```js
props: MessageDescriptor & {
    values?: object,
    tagName?: string,
    children?: (...formattedMessage: Array<ReactElement>) => ReactElement,
}
```

By default `<FormattedMessage>` will render the formatted string into a `<span>`. If you need to customize rendering, you can either wrap it with another React element (recommended), specify a different `tagName` (e.g., `'div'`), or pass a function as the child.

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

`<FormattedMessage>` also supports rich-text formatting by passing React elements to the `values` prop. In the message you need to use a simple argument (e.g., `{name}`); here's an example:

```js
<FormattedMessage
  id="app.greeting"
  description="Greeting to welcome the user to the app"
  defaultMessage="Hello, {name}!"
  values={{
    name: <b>Eric</b>,
  }}
/>
```

```html
<span>Hello, <b>Eric</b>!</span>
```

This allows messages to still be defined as a plain string _without_ HTML — making it easier for it to be translated. At runtime, React will also optimize this by only re-rendering the variable parts of the message when they change. In the above example, if the user changed their name, React would only need to update the contents of the `<b>` element.

### `<FormattedHTMLMessage>`

**Note:** This component is provided for apps that have legacy external strings which contain HTML, but is not recommended, use [`<FormattedMessage>`](#formattedmessage) instead, if you can.

This component uses the [`formatHTMLMessage`](API.md#formathtmlmessage) API and has the same props as `<FormattedMessage>`, but it will accept messages that contain HTML. In order to protect against XSS, all string `values` will be HTML-escaped and the resulting formatted message will be set via `dangerouslySetInnerHTML`. This means that `values` _cannot_ contain React element like `<FormattedMessage>` and this component will be less performant.

### Using React-Intl with React Native

React Intl uses the `span` element by default to render text. On React Native we need to use a `Text` element.

In order to achieve this, you need to tell the `IntlProvider` to use the `Text` component.

If you wish to add custom styling to the Text element, we suggest that you create a custom React component `MyText` that contains that styling and pass that component instead of `Text`.

```

import { Text } from 'react-native';

<IntlProvider locale="en" textComponent={Text}>
    <App />
</IntlProvider>

```
