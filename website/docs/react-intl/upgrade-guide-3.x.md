---
id: upgrade-guide-3x
title: Upgrade Guide (v2 -> v3)
---

## Breaking API Changes

- `addLocaleData` has been removed. See [Migrate to using native Intl APIs](#migrate-to-using-native-intl-apis) for more details.
- `ReactIntlLocaleData` has been removed. See [Migrate to using native Intl APIs](#migrate-to-using-native-intl-apis) for more details.
- `intlShape` has been removed. See [TypeScript Support](#typescript-support) for more details.
- Change default `textComponent` in `IntlProvider` to `React.Fragment`. In order to keep the old behavior, you can explicitly set `textComponent` to `span`.

```tsx
<IntlProvider textComponent="span" />
```

- `FormattedRelative` has been renamed to `FormattedRelativeTime` and its API has changed significantly. See [FormattedRelativeTime](#formattedrelativetime) for more details.
- `formatRelative` has been renamed to `formatRelativeTime` and its API has changed significantly. See [FormattedRelativeTime](#formattedrelativetime) for more details.
- Message Format syntax changes. See [Message Format Syntax Changes](#message-format-syntax-changes) for more details.
- `IntlProvider` no longer inherits from upstream `IntlProvider`.

## Use React 16.3 and upwards

React Intl v3 supports the new context API, fixing all kinds of tree update problems :tada:
In addition it makes use of the new lifecycle hooks (and gets rid of the [deprecated](https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html) ones).
It also supports the new `React.forwardRef()` enabling users to directly access refs using the standard `ref` prop (see beneath for further information).

## Migrate withRef to forwardRef

With the update to React `>= 16.3` we got the option to use the new `React.forwardRef()` feature and because of this deprecated the use of the `withRef` option for the `injectIntl` HOC in favour of `forwardRef`.
When `forwardRef` is set to true, you can now simply pretend the HOC wasn't there at all.

Intl v2:

```tsx
import React from 'react';
import {injectIntl} from 'react-intl';

class MyComponent extends React.Component {
  doSomething = () => console.log(this.state || null);

  render() {
    return <div>Hello World</div>;
  }
}

export default injectIntl(MyComponent, {withRef: true});

// somewhere else
class Parent extends React.Component {
  componentDidMount() {
    this.myComponentRef.getWrappedInstance().doSomething();
  }

  render() {
    return (
      <MyComponent
        ref={ref => {
          this.myComponentRef = ref;
        }}
      />
    );
  }
}
```

Intl v3:

```tsx
import React from 'react';
import {injectIntl} from 'react-intl';

class MyComponent extends React.Component {
  doSomething = () => console.log(this.state || null);

  render() {
    return <div>Hello World</div>;
  }
}

export default injectIntl(MyComponent, {forwardRef: true});

// somewhere else
class Parent extends React.Component {
  myComponentRef = React.createRef();

  componentDidMount() {
    this.myComponentRef.doSomething(); // no need to call getWrappedInstance()
  }

  render() {
    return <MyComponent ref={this.myComponentRef} />;
  }
}
```

## New useIntl hook as an alternative of injectIntl HOC

This v3 release also supports the latest React hook API for user with React `>= 16.8`. You can now take `useIntl` hook as an alternative to `injectIntl` HOC on _function components_. Both methods allow you to access the `intl` instance, here is a quick comparison:

```tsx
// injectIntl
import {injectIntl} from 'react-intl';

const MyComponentWithHOC = injectIntl(({intl, ...props}) => {
  // do something
});

// useIntl
import {useIntl} from 'react-intl';

const MyComponentWithHook = props => {
  const intl = useIntl();

  // do something
};
```

To keep the API surface clean and simple, we only provide `useIntl` hook in the package. If preferable, user can wrap this built-in hook to make customized hook like `useFormatMessage` easily. Please visit React's official website for more general [introduction on React hooks](https://reactjs.org/docs/hooks-intro.html).

## Migrate to using native Intl APIs

React Intl v3 no longer comes with CLDR data and rely on native Intl API instead. Specifically the new APIs we're relying on are:

- [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules): This can be polyfilled using [this package](https://www.npmjs.com/package/@formatjs/intl-pluralrules).
- [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat): This can be polyfilled using [this package](https://www.npmjs.com/package/@formatjs/intl-relativetimeformat).

This shift is meant to future-proof React Intl as these APIs are all stable and being implemented in modern browsers. This also means we no longer package and consume CLDRs in this package.

If you previously were using `addLocaleData` to support older browsers, we recommend you do the following:

1. If you're supporting browsers that do not have [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules) (e.g IE11 & Safari 12-), include this [polyfill](https://www.npmjs.com/package/@formatjs/intl-pluralrules) in your build.
2. If you're supporting browsers that do not have [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat) (e.g IE11, Edge, Safari 13-), include this [polyfill](https://www.npmjs.com/package/@formatjs/intl-relativetimeformat) in your build along with individual CLDR data for each locale you support.

```tsx
require('@formatjs/intl-pluralrules/polyfill');
require('@formatjs/intl-pluralrules/locale-data/de'); // Add locale data for de

require('@formatjs/intl-relativetimeformat/polyfill');
require('@formatjs/intl-relativetimeformat/locale-data/de'); // Add locale data for de
```

When using React Intl in Node.js, your `node` binary has to either:

- Get compiled with `full-icu` using these [instructions](https://nodejs.org/api/intl.html)

**OR**

- Uses [`full-icu` npm package](https://www.npmjs.com/package/full-icu)

## TypeScript Support

`react-intl` has been rewritten in TypeScript and thus has native TypeScript support. Therefore, we've also removed `prop-types` dependency and expose `IntlShape` as an interface instead.

All types should be available from top level `index` file without importing from specific subfiles. For example:

```ts
import {IntlShape} from 'react-intl'; // Correct
import {IntlShape} from 'react-intl/lib/types'; // Incorrect
```

If we're missing any interface top level support, please let us know and/or submitting a PR is greatly appreciated :)

:::info
You might need to make a few changes to your code if you were relying on the now deprecated **@types/react-intl** package. The most common example is `InjectedIntlProps` which must be replaced with `WrappedComponentProps`.
:::

## FormattedRelativeTime

When we introduced `FormattedRelative`, the spec for [`Intl.RelativeTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat) was still unstable. It has now reached stage 3 and multiple browsers have implemented it. However, its API is different from `FormattedRelative` so we've adjusted its API to match the spec which means it's not backwards compatible.

1. All `units` (such as `day-short`) becomes a combination of `unit` & `style`:

```tsx
<FormattedRelative units="second-short"/>
// will be
<FormattedRelativeTime unit="second" style="short"/>
```

2. `style` becomes `numeric` (which is the default):

```tsx
<FormattedRelative style="numeric"/>
// will be
<FormattedRelativeTime />

<FormattedRelative style="best fit"/>
// will be
<FormattedRelativeTime numeric="auto"/>
```

3. Type of `value` is no longer `Date`, but rather `delta` in the specified `unit`:

```tsx
<FormattedRelative value={Date.now() - 1000} units="second-narrow"/>
// will be
<FormattedRelativeTime value={-1} unit="second" style="narrow" />

<FormattedRelative value={Date.now() + 2000} units="second-narrow"/>
// will be
<FormattedRelativeTime value={2} unit="second" style="narrow" />
```

5. `updateInterval` becomes `updateIntervalInSeconds` and will only take the time delta in seconds. Update behavior remains the same, e.g:

```tsx
<FormattedRelativeTime
  value={2}
  numeric="auto"
  unit="second"
  style="narrow"
  updateIntervalInSeconds={1}
/>
// Initially prints: `in 2s`
// 1 second later: `in 1s`
// 1 second later: `now`
// 1 second later: `1s ago`
// 60 seconds later: `1m ago`
```

6. `initialNow` has been removed.

Similarly, the functional counterpart of this component which is `formatRelative` has been renamed to `formatRelativeTime` and its parameters have been changed to reflect this component's props accordingly.

7. Implementing `FormattedRelative` behavior

You can use `@formatjs/intl-utils` to get close to the previous behavior like this:

```tsx
import {selectUnit} from '@formatjs/intl-utils';
const {value, unit} = selectUnit(Date.now() - 48 * 3600 * 1000);
// render
<FormattedRelativeTime value={value} unit={unit} />;
```

## Enhanced `FormattedMessage` & `formatMessage` rich text formatting

In v2, in order to do rich text formatting (embedding a `ReactElement`), you had to do this:

```tsx
<FormattedMessage
  defaultMessage="To buy a shoe, { link } and { cta }"
  values={{
    link: (
      <a class="external_link" target="_blank" href="https://www.shoe.com/">
        visit our website
      </a>
    ),
    cta: <strong class="important">eat a shoe</strong>,
  }}
/>
```

Now you can do:

```tsx
<FormattedMessage
  defaultMessage="To buy a shoe, <a>visit our website</a> and <cta>eat a shoe</cta>"
  values={{
    a: msg => (
      <a class="external_link" target="_blank" href="https://www.shoe.com/">
        {msg}
      </a>
    ),
    cta: msg => <strong class="important">{msg}</strong>,
  }}
/>
```

The change solves several issues:

1. Contextual information was lost when you need to style part of the string: In this example above, `link` effectively is a blackbox placeholder to a translator. It can be a person, an animal, or a timestamp. Conveying contextual information via `description` & `placeholder` variable is often not enough since the variable can get sufficiently complicated.
2. This brings feature-parity with other translation libs, such as [fluent](https://projectfluent.org/) by Mozilla (using Overlays).

If previously in cases where you pass in a `ReactElement` to a placeholder we highly recommend that you rethink the structure so that as much text is declared as possible:

Before

```tsx
<FormattedMessage
  defaultMessage="Hello, {name} is {awesome} and {fun}"
  values={{
    name: <b>John</b>,
    awesome: <span style="font-weight: bold;">awesome</span>
    fun: <span>fun and <FormattedTime value={Date.now()}/></span>
  }}
/>
```

After

```tsx
<FormattedMessage
  defaultMessage="Hello, <b>John</b> is <custom>awesome</custom> and <more>fun and {ts, time}</more>"
  values={{
    b: name => <b>{name}</b>,
    custom: str => <span style="font-weight: bold;">{str}</span>,
    more: chunks => <span>{chunks}</span>,
  }}
/>
```

## ESM Build

`react-intl` and its underlying libraries (`intl-messageformat-parser`, `intl-messageformat`, `@formatjs/intl-relativetimeformat`, `intl-format-cache`, `intl-utils`) export ESM artifacts. This means you should configure your build toolchain to transpile those libraries.

### Jest

Add `transformIgnorePatterns` to always include those libraries, e.g:

```tsx
{
  transformIgnorePatterns: [
    '/node_modules/(?!intl-messageformat|intl-messageformat-parser).+\\.js$',
  ],
}
```

### webpack

If you're using `babel-loader`, add those libraries in `include`, e.g:

```tsx
include: [
  path.join(__dirname, "node_modules/react-intl"),
  path.join(__dirname, "node_modules/intl-messageformat"),
  path.join(__dirname, "node_modules/intl-messageformat-parser"),
],
```

## Creating intl without using Provider

We've added a new API called `createIntl` that allows you to create an `IntlShape` object without using `Provider`. This allows you to format things outside of React lifecycle while reusing the same `intl` object. For example:

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

This is especially beneficial in SSR where you can reuse the same `intl` object across requests.

## Message Format Syntax Changes

We've rewritten our parser to be more faithful to [ICU Message Format](https://ssl.icu-project.org/apiref/icu4j/com/ibm/icu/text/MessageFormat.html), in order to potentially support skeleton. So far the backwards-incompatible changes are:

### Escape character has been changed to apostrophe (`'`).

Previously while we were using ICU message format syntax, our escape char was backslash (`\`). This however creates issues with strict ICU translation vendors that support other implementations like ICU4J/ICU4C. Thanks to [@pyrocat101](https://github.com/pyrocat101) we've changed this behavior to be spec-compliant. This means:

```tsx
// Before
<FormattedMessage defaultMessage="\\{foo\\}" /> //prints out "{foo}"

// After
<FormattedMessage defaultMessage="'{foo}'" /> //prints out "{foo}"
```

We highly recommend reading the spec to learn more about how quote/escaping works [here](http://userguide.icu-project.org/formatparse/messages) under **Quoting/Escaping** section.

### Placeholder argument syntax change

Placeholder argument can no longer have `-` (e.g: `this is a {placeholder-var}` is invalid but `this is a {placeholder_var}` is).

## Testing

We've removed `IntlProvider.getChildContext` for testing and now you can use `createIntl` to create a standalone `intl` object outside of React and use that for testing purposes. See [Testing with React Intl](../guides/testing-with-react-intl.md) for more details.
