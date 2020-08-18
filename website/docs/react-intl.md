---
id: react-intl
title: Overview
---

[![npm Version](https://img.shields.io/npm/v/react-intl.svg?style=flat-square)](https://www.npmjs.org/package/react-intl)

**Welcome to React Intl's docs! This is the place to find React Intl's docs**. Feel free to open a pull request and contribute to the docs to make them better.

## Runtime Requirements

**We support IE11 & 2 most recent versions of Edge, Chrome, Firefox & Safari.**

React Intl relies on these `Intl` APIs:

- [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat): Available on IE11+
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat): Available on IE11+
- [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules): This can be polyfilled using [this package](polyfills/intl-pluralrules.md).
- [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat): This can be polyfilled using [this package](polyfills/intl-relativetimeformat.md).
- (Optional) [Intl.DisplayNames](https://tc39.es/proposal-intl-displaynames/): Required if you use [`formatDisplayName`](react-intl/api.md#formatdisplayname)
  or [`FormattedDisplayName`](react-intl/components.md#formatteddisplayname). This can be polyfilled using [this package](polyfills/intl-displaynames.md).

If you need to support older browsers, we recommend you do the following:

1. Polyfill `Intl.NumberFormat` with [`@formatjs/intl-numberformat`](polyfills/intl-numberformat.md).
2. Polyfill `Intl.DateTimeFormat` with [`@formatjs/intl-datetimeformat`](polyfills/intl-datetimeformat.md)
3. If you're supporting browsers that do not have [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules) (e.g IE11 & Safari 12-), include this [polyfill](polyfills/intl-pluralrules.md) in your build.

4. If you're supporting browsers that do not have [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat) (e.g IE11, Edge, Safari 12-), include this [polyfill](polyfills/intl-relativetimeformat.md) in your build along with individual CLDR data for each locale you support.

5. If you need `Intl.DisplayNames`, include this [polyfill](polyfills/intl-displaynames.md) in your build along with individual CLDR data for each locale you support.

### Browser

We officially support IE11 along with 2 most recent versions of Edge, Chrome & Firefox.

### Node.js

#### full-icu

Starting with Node.js 13.0.0 full-icu is supported by default.

If using React Intl in an earlier version of Node.js, your `node` binary has to either:

- Get compiled with `full-icu` using these [instructions](https://nodejs.org/api/intl.html)

**OR**

- Uses [`full-icu` npm package](https://www.npmjs.com/package/full-icu)

If your `node` version is missing any of the `Intl` APIs above, you'd have to polyfill them accordingly.

### React Native

If you're using `react-intl` in React Native, make sure your runtime has built-in `Intl` support (similar to [JSC International variant](https://github.com/react-native-community/jsc-android-buildscripts#international-variant)). See these issues for more details:

- https://github.com/formatjs/formatjs/issues/1356
- https://github.com/formatjs/formatjs/issues/992

#### React Native on iOS

If you cannot use the Intl variant of JSC (e.g on iOS), follow the instructions in [Runtime Requirements](#runtime-requirements) to polyfill those APIs accordingly.

## Experimental Intl Features

FormatJS also provides types & polyfill for the following Intl API proposals:

- NumberFormat: [polyfill](polyfills/intl-numberformat.md) & [spec](https://tc39.es/ecma402/)
- DisplayNames: [polyfill](polyfills/intl-displaynames.md) & [spec](https://tc39.es/proposal-intl-displaynames/)

## The `react-intl` Package

Install the [`react-intl` npm package](https://www.npmjs.com/package/react-intl) via npm:

```bash
$ npm install react-intl --save
```

The `react-intl` npm package distributes the following modules (links from [unpkg](https://unpkg.com/)):

- [**CommonJS**](https://unpkg.com/react-intl@latest/dist/index.js):
  unbundled dependencies, `"main"` in `package.json`, warnings in dev.
- [**ES6**](https://unpkg.com/react-intl@latest/lib/index.js):
  unbundled dependencies, `"module"` in `package.json`, warnings in dev.
- [**UMD dev**](https://unpkg.com/react-intl@latest/dist/react-intl.js):
  bundled dependencies (except `react`), browser or Node, warnings.
- [**UMD prod**](https://unpkg.com/react-intl@latest/dist/react-intl.min.js):
  minified, bundled dependencies (except `react`), browser or Node, no warnings.

### Module Bundlers

We've made React Intl work well with module bundlers like: Browserify, Webpack, or Rollup which can be used to bundle React Intl for the browser:

- The `"browser"` field in `package.json` is specified so that only basic English locale data is included when bundling. This way when using the `"main"` module in Node all locale data is loaded, but ignored when bundled for the browser.

- An ES6 version of React Intl is provided as `"jsnext:main"` and `"module"` in `package.json` and can be used with Rollup.

- Development-time warnings are wrapped with `process.env.NODE_ENV !== 'production'`, this allows you to specify `NODE_ENV` when bundling and minifying to have these code blocks removed.

## The React Intl Module

Whether you use the ES6, CommonJS, or UMD version of React Intl, they all provide the same named exports:

- [`injectIntl`](react-intl/api.md#injectintl)
- [`defineMessages`](react-intl/api.md#definemessages)
- [`IntlProvider`](react-intl/components.md#intlprovider)
- [`FormattedDate`](react-intl/components.md#formatteddate)
- [`FormattedTime`](react-intl/components.md#formattedtime)
- [`FormattedRelativeTime`](react-intl/components.md#formattedrelativetime)
- [`FormattedNumber`](react-intl/components.md#formattednumber)
- [`FormattedPlural`](react-intl/components.md#formattedplural)
- [`FormattedMessage`](react-intl/components.md#formattedmessage)

:::danger react
When using the UMD version of React Intl _without_ a module system, it will expect `react` to exist on the global variable: **`React`**, and put the above named exports on the global variable: **`ReactIntl`**.
:::

## Creating an I18n Context

Now with React Intl and its locale data loaded an i18n context can be created for your React app.

React Intl uses the provider pattern to scope an i18n context to a tree of components. This allows configuration like the current locale and set of translated strings/messages to be provided at the root of a component tree and made available to the `<Formatted*>` components. This is the same concept as what Flux frameworks like [Redux](http://redux.js.org/) use to provide access to a store within a component tree.

**All apps using React Intl must use the [`<IntlProvider>` component](react-intl/components.md#intlprovider).**

The most common usage is to wrap your root React component with `<IntlProvider>` and configure it with the user's current locale and the corresponding translated strings/messages:

```tsx
ReactDOM.render(
  <IntlProvider locale={usersLocale} messages={translationsForUsersLocale}>
    <App />
  </IntlProvider>,
  document.getElementById('container')
)
```

**See:** The [**`<IntlProvider>` docs**](react-intl/components.md#intlprovider) for more details.

## Formatting Data

React Intl has two ways to format data, through [React components](react-intl/components.md) and its [API](react-intl/api.md). The components provide an idiomatic-React way of integrating internationalization into a React app, and the `<Formatted*>` components have [benefits](react-intl/components.md#why-components) over always using the imperative API directly. The API should be used when your React component needs to format data to a string value where a React element is not suitable; e.g., a `title` or `aria` attribute, or for side-effect in `componentDidMount`.

React Intl's imperative API is accessed via [**`injectIntl`**](react-intl/api.md#injectintl), a High-Order Component (HOC) factory. It will wrap the passed-in React component with another React component which provides the imperative formatting API into the wrapped component via its `props`. (This is similar to the connect-to-stores pattern found in many Flux implementations.)

Here's an example using `<IntlProvider>`, `<Formatted*>` components, and the imperative API to setup an i18n context and format data:

```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import {injectIntl, IntlProvider, FormattedRelative, useIntl} from 'react-intl';

const MS_IN_DAY = 1e3 * 3600 * 24

const PostDate = ({date}) => {
  const intl = useIntl()
  return (
    <span title={intl.formatDate(date)}>
      <FormattedRelativeTime value={(Date.now() - date)/MS_IN_DAY} unit="day"/>
    </span>
  )
});

const App = ({post}) => (
  <div>
    <h1>{post.title}</h1>
    <p>
      <PostDate date={post.date} />
    </p>
    <div>{post.body}</div>
  </div>
);

ReactDOM.render(
  <IntlProvider locale={navigator.language}>
    <App
      post={{
        title: 'Hello, World!',
        date: new Date(1459913574887),
        body: 'Amazing content.',
      }}
    />
  </IntlProvider>,
  document.getElementById('container')
);
```

Assuming `navigator.language` is `"en-us"`:

```html
<div>
  <h1>Hello, World!</h1>
  <p><span title="4/5/2016">yesterday</span></p>
  <div>
    Amazing content.
  </div>
</div>
```

**See:** The [**API docs**][api] and [**Component docs**][components] for more details.

# ESM Build

`react-intl` and its underlying libraries (`intl-messageformat-parser`, `intl-messageformat`, `@formatjs/intl-relativetimeformat`, `intl-utils`) export ESM artifacts. This means you should configure your build toolchain to transpile those libraries.

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

If you're using `babel-loader`, or `ts-loader`, you can do 1 of the following:

1. Add those libraries in `include`:

```ts
{
  include: [
    path.join(__dirname, 'node_modules/react-intl'),
    path.join(__dirname, 'node_modules/intl-messageformat'),
    path.join(__dirname, 'node_modules/intl-messageformat-parser'),
  ]
}
```

OR

2. Add those libraries in `exclude`:

```tsx
exclude: /node_modules\/(?!react-intl|intl-messageformat|intl-messageformat-parser)/,
```

# Core Concepts

- Formatters (Date, Number, Message, Relative)
- Provider and Injector
- API and Components
- Message Descriptor
- Message Syntax
- Defining default messages for extraction
- Custom, named formats

# Example Apps

There are several [**runnable example apps**](https://github.com/formatjs/formatjs/tree/master/packages/react-intl/examples) in this Git repo. These are a great way to see React Intl's [core concepts](#core-concepts) in action in simplified applications.

# API Reference

There are a few API layers that React Intl provides and is built on. When using React Intl you'll be interacting with `Intl` built-ins, React Intl's API, and its React components:

- [ECMAScript Internationalization API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [React Intl API](react-intl/api.md)
- [React Intl Components](react-intl/components.md)

# TypeScript Usage

`react-intl` is written in TypeScript, thus having 1st-class TS support.

In order to use `react-intl` in TypeScript, make sure your `compilerOptions`'s `lib` config include `["esnext.intl", "es2017.intl", "es2018.intl"]`.

# Advanced Usage

Our [Advanced Usage](guides/advanced-usage.md) has further guides for production setup in environments where performance is important.

# Supported Tooling

## Message extraction

We've built [@formatjs/cli](tooling/cli.md) that helps you extract messages from a list of files. It uses [babel-plugin-react-intl](tooling/babel-plugin.md) under the hood and should be able to extract messages if you're declaring using 1 of the mechanisms below:

```tsx
import {defineMessages} from 'react-intl'

defineMessages({
  foo: {
    id: 'foo',
    defaultMessage: 'foo',
    description: 'bar',
  },
})
```

```tsx
import {FormattedMessage} from 'react-intl'
;<FormattedMessage id="foo" defaultMessage="foo" description="bar" />
```

```tsx
function Comp(props) {
  const {intl} = props
  return intl.formatMessage({
    // The whole `intl.formatMessage` is required so we can extract
    id: 'foo',
    defaultMessage: 'foo',
    description: 'bar',
  })
}
```

## ESLint Plugin

We've also built [eslint-plugin-formatjs](tooling/linter.md) that helps enforcing specific rules on your messages if your translation vendor has restrictions.
