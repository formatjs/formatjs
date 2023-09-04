---
id: components
title: Components
---

React Intl has a set of React components that provide a declarative way to setup an i18n context and format dates, numbers, and strings for display in a web UI. The components render React elements by building on React Intl's imperative [API](api.md).

## Why Components?

Beyond providing an idiomatic-React way of integrating internationalization into a React app, and the `<Formatted*>` components have benefits over always using the imperative API directly:

- Render React elements that seamlessly compose with other React components.
- Support rich-text string/message formatting in `<FormattedMessage>`.
- Implement advanced features like `<FormattedRelativeTime>`'s updating over time.
- Provide TypeScript type definitions.

## IntlProvider

React Intl uses the provider pattern to scope an i18n context to a tree of components. This allows configuration like the current locale and set of translated strings/messages to be provided at the root of a component tree and made available to the `<Formatted*>` components. This is the same concept as what Flux frameworks like [Redux](http://redux.js.org/) use to provide access to a store within a component tree.

:::caution
All apps using React Intl must use the `<IntlProvider>` or `<RawIntlProvider>` component.
:::

This component is used to setup the i18n context for a tree. Usually, this component will wrap an app's root component so that the entire app will be within the configured i18n context. The following are the i18n configuration props that can be set:

```ts
interface IntlConfig {
  locale: string
  formats: CustomFormats
  messages: Record<string, string> | Record<string, MessageFormatElement[]>
  defaultLocale: string
  defaultFormats: CustomFormats
  timeZone?: string
  textComponent?: React.ComponentType | keyof React.ReactHTML
  wrapRichTextChunksInFragment?: boolean
  defaultRichTextElements?: Record<string, FormatXMLElementFn<React.ReactNode>>
  onError(err: string): void
}
```

### locale, formats, and messages

The user's current locale and what the app should be rendered in. While `defaultLocale` and `defaultFormats` are for fallbacks or during development and represent the app's default. Notice how there is no `defaultMessages`, that's because each [Message Descriptor](#message-descriptor) provides a `defaultMessage`.

### defaultLocale and defaultFormats

Default locale & formats for when a message is not translated (missing from `messages`). `defaultLocale` should be the locale that `defaultMessage`s are declared in so that a sentence is coherent in a single locale. Without `defaultLocale` and/or if it's set incorrectly, you might run into scenario where a sentence is in English but embedded date/time is in Spanish.

### textComponent

Provides a way to configure the default wrapper for React Intl's `<Formatted*>` components. If not specified, [`<React.Fragment>`](https://reactjs.org/docs/fragments.html) is used. Before V3, `span` was used instead; check the [migration guide](upgrade-guide-3.x.md) for more info.

### onError

Allows the user to provide a custom error handler. By default, error messages are logged using `console.error` if `NODE_ENV` is not set to `production`.

### onWarn

Allows the user to provide a custom warning handler. By default, warning messages are logged using `console.warning` if `NODE_ENV` is not set to `production`.

### wrapRichTextChunksInFragment

When formatting rich text message, the output we produced is of type `Array<string | React.ReactElement>`, which will trigger key error. This wraps the output in a single `React.Fragment` to suppress that.

### defaultRichTextElements

A map of tag to rich text formatting function. This is meant to provide a centralized way to format common tags such as `<b>`, `<p>`... or enforcing certain Design System in the codebase (e.g standardized `<a>` or `<button>`...). See https://github.com/formatjs/formatjs/issues/1752 for more context.

These configuration props are combined with the `<IntlProvider>`'s component-specific props:

**Props:**

```tsx
props: IntlConfig &
  {
    children: ReactNode,
  }
```

Finally, child elements _must_ be supplied to `<IntlProvider>`.

**Example:**

```tsx
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
)

ReactDOM.render(
  <IntlProvider locale={navigator.language}>
    <App importantDate={new Date(1459913574887)} />
  </IntlProvider>,
  document.getElementById('container')
)
```

Assuming `navigator.language` is `"fr"`:

```html
<div>mardi 5 avril 2016</div>
```

## RawIntlProvider

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

## FormattedDate

This component uses the [`formatDate`](api.md#formatdate) and [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) APIs and has `props` that correspond to the `DateTimeFormatOptions` specified above.

**Props:**

```ts
props: Intl.DateTimeFormatOptions &
  {
    value: any,
    format: string,
    children: (formattedDate: string) => ReactElement,
  }
```

By default `<FormattedDate>` will render the formatted date into a `<React.Fragment>`. If you need to customize rendering, you can either wrap it with another React element (recommended), or pass a function as the child.

**Example:**

```tsx live
<FormattedDate value={new Date(1459832991883)} />
```

**Example with Options:**

```tsx live
<FormattedDate
  value={new Date(1459832991883)}
  year="numeric"
  month="long"
  day="2-digit"
/>
```

## FormattedDateParts

:::caution browser support
This requires [Intl.DateTimeFormat.prototype.formatToParts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/formatToParts) which is not available in IE11. Please use our [polyfill](../polyfills/intl-datetimeformat.md) if you plan to support IE11.
:::

This component provides more customization to `FormattedDate` by allowing children function to have access to underlying parts of the formatted date. The available parts are listed [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts)

**Props:**

```ts
props: Intl.DateTimeFormatOptions &
  {
    value: any,
    format: string,
    children: (parts: Intl.DateTimeFormatPart[]) => ReactElement,
  }
```

```tsx live
<FormattedDateParts
  value={new Date(1459832991883)}
  year="numeric"
  month="long"
  day="2-digit"
>
  {parts => (
    <>
      <b>{parts[0].value}</b>
      {parts[1].value}
      <small>{parts[2].value}</small>
    </>
  )}
</FormattedDateParts>
```

## FormattedTime

This component uses the [`formatTime`](api.md#formattime) and [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) APIs and has `props` that correspond to the `DateTimeFormatOptions` specified above, with the following defaults:

```tsx
{
    hour: 'numeric',
    minute: 'numeric',
}
```

**Props:**

```tsx
props: DateTimeFormatOptions &
  {
    value: any,
    format: string,
    children: (formattedDate: string) => ReactElement,
  }
```

By default `<FormattedTime>` will render the formatted time into a `React.Fragment`. If you need to customize rendering, you can either wrap it with another React element (recommended), or pass a function as the child.

**Example:**

```tsx live
<FormattedTime value={new Date(1459832991883)} />
```

## FormattedTimeParts

:::caution browser support
This requires [Intl.DateTimeFormat.prototype.formatToParts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/formatToParts) which is not available in IE11. Please use our [polyfill](../polyfills/intl-datetimeformat.md) if you plan to support IE11.
:::

This component provides more customization to `FormattedTime` by allowing children function to have access to underlying parts of the formatted date. The available parts are listed [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts)

**Props:**

```ts
props: Intl.DateTimeFormatOptions &
  {
    value: any,
    format: string,
    children: (parts: Intl.DateTimeFormatPart[]) => ReactElement,
  }
```

```tsx live
<FormattedTimeParts value={new Date(1459832991883)}>
  {parts => (
    <>
      <b>{parts[0].value}</b>
      {parts[1].value}
      <small>{parts[2].value}</small>
    </>
  )}
</FormattedTimeParts>
```

## FormattedDateTimeRange

:::caution browser support
This requires stage-3 API [Intl.RelativeTimeFormat.prototype.formatRange](https://github.com/tc39/proposal-intl-DateTimeFormat-formatRange) which has limited browser support. Please use our [polyfill](../polyfills/intl-datetimeformat.md) if you plan to support them.
:::

This component uses the [`formatDateTimeRange`](api.md#formatdatetimerange) and [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) APIs and has `props` that correspond to the `DateTimeFormatOptions` specified above

**Props:**

```tsx
props: DateTimeFormatOptions &
  {
    from: number | Date,
    to: number | Date,
    children: (formattedDate: string) => ReactElement,
  }
```

By default `<FormattedDateTimeRange>` will render the formatted time into a `React.Fragment`. If you need to customize rendering, you can either wrap it with another React element (recommended), or pass a function as the child.

**Example:**

```tsx live
<FormattedDateTimeRange
  from={new Date('2020-1-1')}
  to={new Date('2020-1-15')}
/>
```

## FormattedRelativeTime

:::caution browser support
This requires [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat) which has limited browser support. Please use our [polyfill](../polyfills/intl-relativetimeformat.md) if you plan to support them.
:::

This component uses the [`formatRelativeTime`](api.md#formatrelativetime) API and has `props` that correspond to the following relative formatting options:

```ts
type RelativeTimeFormatOptions = {
  numeric?: 'always' | 'auto'
  style?: 'long' | 'short' | 'narrow'
}
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
  }
```

By default `<FormattedRelativeTime>` will render the formatted relative time into a `React.Fragment`. If you need to customize rendering, you can either wrap it with another React element (recommended), or pass a function as the child.

**Example:**

```tsx live
<FormattedRelativeTime value={0} numeric="auto" updateIntervalInSeconds={1} />
```

:::info maximum interval
You can adjust the maximum interval that the component will re-render by setting the `updateIntervalInSeconds`. A falsy value will turn off auto-updating. The updating is smart and will schedule the next update for the next _interesting moment_.
:::

An _interesting moment_ is defined as the next non-fractional `value` for that `unit`. For example:

```tsx live
<FormattedRelativeTime value={-50} updateIntervalInSeconds={1} />
```

This will initially renders `59 seconds ago`, after 1 second, will render `1 minute ago`, and will not re-render until a full minute goes by, it'll render `2 minutes ago`. It will not try to render `1.2 minutes ago`.

:::caution limitation
`updateIntervalInSeconds` cannot be enabled for `unit` longer than `hour` (so not for `day`, `week`, `quarter`, `year`). This is primarily because it doesn't make sense to schedule a timeout in `day`s, and the number of `ms` in a day is larger than the max timeout that `setTimeout` accepts.
:::

## FormattedNumber

This component uses the [`formatNumber`](api.md#formatnumber) and [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat) APIs and has `props` that correspond to `Intl.NumberFormatOptions`.

**Props:**

```ts
props: NumberFormatOptions &
  {
    value: number,
    format: string,
    children: (formattedNumber: string) => ReactElement,
  }
```

By default `<FormattedNumber>` will render the formatted number into a `React.Fragment`. If you need to customize rendering, you can either wrap it with another React element (recommended), or pass a function as the child.

**Example:**

```tsx live
<FormattedNumber value={1000} />
```

**Example Formatting Currency Values**

```tsx live
<FormattedNumber value={1000} style="currency" currency="USD" />
```

**Formatting Number using `unit`**

Currently this is part of ES2020 [NumberFormat](https://tc39.es/ecma402/#numberformat-objects).
We've provided a polyfill [here](../polyfills/intl-numberformat.md) and `react-intl` types allow users to pass
in a [sanctioned unit](../polyfills/intl-numberformat.md#SupportedUnits). For example:

```tsx live
<FormattedNumber
  value={1000}
  style="unit"
  unit="kilobyte"
  unitDisplay="narrow"
/>
```

```tsx live
<FormattedNumber
  value={1000}
  unit="fahrenheit"
  unitDisplay="long"
  style="unit"
/>
```

## FormattedNumberParts

:::caution browser support
This requires [Intl.NumberFormat.prototype.formatToParts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/formatToParts) which is not available in IE11. Please use our [polyfill](../polyfills/intl-numberformat.md) if you plan to support IE11.
:::

This component provides more customization to `FormattedNumber` by allowing children function to have access to underlying parts of the formatted number. The available parts are listed [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat/formatToParts).

**Props:**

```ts
props: NumberFormatOptions &
  {
    value: number,
    format: string,
    children: (parts: Intl.NumberFormatPart[]) => ReactElement,
  }
```

**Example:**

```tsx live
<FormattedNumberParts value={1000}>
  {parts => (
    <>
      <b>{parts[0].value}</b>
      {parts[1].value}
      <small>{parts[2].value}</small>
    </>
  )}
</FormattedNumberParts>
```

## FormattedPlural

This component uses the [`formatPlural`](api.md#formatplural) API and [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules) has `props` that correspond to `Intl.PluralRulesOptions`.

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
  }
```

By default `<FormattedPlural>` will select a [plural category](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) (`zero`, `one`, `two`, `few`, `many`, or `other`) and render the corresponding React element into a `React.Fragment`. If you need to customize rendering, you can either wrap it with another React element (recommended), or pass a function as the child.

**Example:**

```tsx live
<FormattedPlural value={10} one="message" other="messages" />
```

## FormattedList

:::caution browser support
This requires [Intl.ListFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat) which has limited browser support. Please use our [polyfill](../polyfills/intl-listformat.md) if you plan to support them.
:::

This component uses [`formatList`](api.md#formatlist) API and [Intl.ListFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ListFormat). Its props corresponds to `Intl.ListFormatOptions`.

**Props:**

```tsx
props: ListFormatOptions &
  {
    children: (chunksOrString: string | React.ReactElement[]) => ReactElement,
  }
```

**Example:**

When the locale is `en`:

```tsx live
<FormattedList type="conjunction" value={['Me', 'myself', 'I']} />
```

```tsx live
<FormattedList type="conjunction" value={['Me', <b>myself</b>, 'I']} />
```

## FormattedListParts

:::caution browser support
This requires [Intl.ListFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat) which has limited browser support. Please use our [polyfill](../polyfills/intl-listformat.md) if you plan to support them.
:::

This component uses [`formatListToParts`](api.md#formatlisttoparts) API and [Intl.ListFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ListFormat). Its props corresponds to `Intl.ListFormatOptions`.

**Props:**

```tsx
props: ListFormatOptions &
  {
    children: (chunks: Array<React.ReactElement | string>) => ReactElement,
  }
```

**Example:**

When the locale is `en`:

```tsx live
<FormattedListParts type="conjunction" value={['Me', 'myself', 'I']}>
  {parts => (
    <>
      <b>{parts[0].value}</b>
      {parts[1].value}
      <small>{parts[2].value}</small>
      {parts[3].value}
      <small>{parts[4].value}</small>
    </>
  )}
</FormattedListParts>
```

## FormattedDisplayName

:::caution browser support
This requires [Intl.DisplayNames](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames) which has limited browser support. Please use our [polyfill](../polyfills/intl-displaynames.md) if you plan to support them.
:::

This component uses [`formatDisplayName`](api.md#formatdisplayname) and [`Intl.DisplayNames`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames)
has `props` that correspond to `DisplayNameOptions`. You might need a [polyfill](../polyfills/intl-displaynames.md).

**Props:**

```ts
props: FormatDisplayNameOptions &
  {
    value: string | number | Record<string, unknown>,
  }
```

**Example:**

When the locale is `en`:

```tsx live
<FormattedDisplayName type="language" value="zh-Hans-SG" />
```

```tsx live
<FormattedDisplayName type="currency" value="JPY" />
```

## FormattedMessage

This component uses the [`formatMessage`](api.md#formatmessage) API and has `props` that correspond to a [Message Descriptor](#message-descriptor).

**Props:**

```tsx
props: MessageDescriptor &
  {
    values: object,
    tagName: string,
    children: (chunks: ReactElement) => ReactElement,
  }
```

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

React Intl has a Message Descriptor concept which is used to define your app's default messages/strings. `<FormattedMessage>` have props which correspond to a Message Descriptor. The Message Descriptors work very well for providing the data necessary for having the strings/messages translated, and they contain the following properties:

- **`id`:** A unique, stable identifier for the message
- **`description`:** Context for the translator about how it's used in the UI
- **`defaultMessage`:** The default message (probably in English)

```tsx
type MessageDescriptor = {
  id?: string
  defaultMessage?: string
  description?: string
}
```

:::info compile message descriptors
The [babel-plugin-formatjs](../tooling/babel-plugin.md) and [@formatjs/ts-transformer](../tooling/ts-transformer.md) packages can be used to compile Message Descriptors defined in JavaScript source files into AST for performance.
:::

### Message Formatting Fallbacks

The message formatting APIs go the extra mile to provide fallbacks for the common situations where formatting fails; at the very least a non-empty string should always be returned. Here's the message formatting fallback algorithm:

1. Lookup and format the translated message at `id`, passed to [`<IntlProvider>`](#intlprovider).
2. Fallback to formatting the `defaultMessage`.
3. Fallback to translated message at `id`'s source.
4. Fallback to `defaultMessage` source.
5. Fallback to the literal message `id`.

### Usage

By default `<FormattedMessage>` will render the formatted string into a `<React.Fragment>`. If you need to customize rendering, you can either wrap it with another React element (recommended), specify a different `tagName` (e.g., `'div'`), or pass a function as the child.

**Example:**

```tsx live
<FormattedMessage
  id="app.greeting"
  description="Greeting to welcome the user to the app"
  defaultMessage="Hello, {name}!"
  values={{
    name: 'Eric',
  }}
/>
```

**Example:** function as the child

```tsx live
<FormattedMessage id="title">{txt => <h1>{txt}</h1>}</FormattedMessage>
```

:::info simple message
Messages can be simple strings _without_ placeholders, and that's the most common type of message. This case is highly-optimized, but still has the benefits of the [fallback procedure](#message-formatting-fallbacks).
:::

### Rich Text Formatting

`<FormattedMessage>` also supports rich-text formatting by specifying a XML tag in the message & resolving that tag in the `values` prop. Here's an example:

```tsx live
<FormattedMessage
  id="app.greeting"
  description="Greeting to welcome the user to the app"
  defaultMessage="Hello, <b>Eric</b> {icon}"
  values={{
    b: chunks => <b>{chunks}</b>,
    icon: <svg />,
  }}
/>
```

By allowing embedding XML tag we want to make sure contextual information is not lost when you need to style part of the string. In a more complicated example like:

```tsx live
<FormattedMessage
  id="foo"
  defaultMessage="To buy a shoe, <a>visit our website</a> and <cta>buy a shoe</cta>"
  values={{
    a: chunks => (
      <a
        class="external_link"
        target="_blank"
        href="https://www.example.com/shoe"
      >
        {chunks}
      </a>
    ),
    cta: chunks => <strong class="important">{chunks}</strong>,
  }}
/>
```

### Function as the child

Since rich text formatting allows embedding `ReactElement`, in function as the child scenario, the function will receive the formatted message chunks as a single parameter.

```tsx live
<FormattedMessage
  id="foo"
  defaultMessage="To buy a shoe, <a>visit our website</a> and <cta>buy a shoe</cta>"
  values={{
    a: chunks => (
      <a
        class="external_link"
        target="_blank"
        href="https://www.example.com/shoe"
      >
        {chunks}
      </a>
    ),
    cta: chunks => <strong class="important">{chunks}</strong>,
  }}
>
  {chunks => <h2>{chunks}</h2>}
</FormattedMessage>
```

All the rich text gets translated together which yields higher quality output. This brings feature-parity with other translation libs as well, such as [fluent](https://projectfluent.org/) by Mozilla (using `overlays` concept).

Extending this also allows users to potentially utilizing other rich text format, like [Markdown](https://daringfireball.net/projects/markdown/).
