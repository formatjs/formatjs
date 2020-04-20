# Getting Started

<!-- toc -->

- [Introduction](#introduction)
  - [Intro Guides](#intro-guides)
  - [Runtime Requirements](#runtime-requirements)
    - [Browser](#browser)
    - [Node.js](#nodejs)
      - [full-icu](#full-icu)
    - [React Native](#react-native)
      - [React Native on iOS](#react-native-on-ios)
  - [Stage-3 Intl Features](#stage-3-intl-features)
  - [The `react-intl` Package](#the-react-intl-package)
    - [Module Bundlers](#module-bundlers)
  - [The React Intl Module](#the-react-intl-module)
  - [Creating an I18n Context](#creating-an-i18n-context)
  - [Formatting Data](#formatting-data)
- [ESM Build](#esm-build)
  - [Jest](#jest)
  - [webpack](#webpack)
- [Core Concepts](#core-concepts)
- [Example Apps](#example-apps)
- [API Reference](#api-reference)
- [TypeScript Usage](#typescript-usage)
- [Advanced Usage](#advanced-usage)
- [Supported Tooling](#supported-tooling)
  - [Message extraction](#message-extraction)
  - [ESLint Plugin](#eslint-plugin)

<!-- tocstop -->

# Introduction

## Intro Guides

Internationalizing web apps is an involved and complex task. If you're new to i18n in JavaScript, it's recommended that you start by reading the following guides:

- [Basic Internationalization Principles](http://formatjs.io/guides/basic-i18n/)
- [Runtime Environments](http://formatjs.io/guides/runtime-environments/)
- [Internationalization Tutorial From Smashing Magazine](https://www.smashingmagazine.com/2017/01/internationalizing-react-apps/)

## Runtime Requirements

**We support IE11 & 2 most recent versions of Edge, Chrome & Firefox.**

React Intl relies on these `Intl` APIs:

- [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat): Available on IE11+
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat): Available on IE11+
- [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules): This can be polyfilled using [this package](https://www.npmjs.com/package/@formatjs/intl-pluralrules).
- [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat): This can be polyfilled using [this package](https://www.npmjs.com/package/@formatjs/intl-relativetimeformat).
- (Optional) [Intl.DisplayNames][displaynames-spec]: Required if you use [`formatDisplayName`](API.md#formatdisplayname)
  or [`FormattedDisplayName`](Components.md#formatteddisplayname). This can be polyfilled using [this package][displaynames-polyfill].

  [displaynames-spec]: https://tc39.es/proposal-intl-displaynames/
  [displaynames-polyfill]: https://www.npmjs.com/package/@formatjs/intl-displaynames

If you need to support older browsers, we recommend you do the following:

1. Polyfill `Intl.NumberFormat` with https://github.com/andyearnshaw/Intl.js
2. Polyfill `Intl.DateTimeFormat` with https://github.com/formatjs/date-time-format-timezone
3. If you're supporting browsers that do not have [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules) (e.g IE11 & Safari 12-), include this [polyfill](https://www.npmjs.com/package/@formatjs/intl-pluralrules) in your build.

```tsx
if (!Intl.PluralRules) {
  require('@formatjs/intl-pluralrules/polyfill')
  require('@formatjs/intl-pluralrules/dist/locale-data/de') // Add locale data for de
}
```

4. If you're supporting browsers that do not have [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat) (e.g IE11, Edge, Safari 12-), include this [polyfill](https://www.npmjs.com/package/@formatjs/intl-relativetimeformat) in your build along with individual CLDR data for each locale you support.

```tsx
if (!Intl.RelativeTimeFormat) {
  require('@formatjs/intl-relativetimeformat/polyfill')
  require('@formatjs/intl-relativetimeformat/dist/locale-data/de') // Add locale data for de
}
```

5. If you need `Intl.DisplayNames`, include this [polyfill][displaynames-polyfill] in your build along
   with individual CLDR data for each locale you support.

```tsx
if (!Intl.DisplayNames) {
  require('@formatjs/intl-displaynames/polyfill')
  require('@formatjs/intl-displaynames/dist/locale-data/de') // Add locale data for de
}
```

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

- https://github.com/formatjs/react-intl/issues/1356
- https://github.com/formatjs/react-intl/issues/992

#### React Native on iOS

If you cannot use the Intl variant of JSC (e.g on iOS), follow the instructions in [Runtime Requirements](#runtime-requirements) to polyfill those APIs accordingly.

## Stage-3 Intl Features

FormatJS also provides types & polyfill for the following Stage 3 Intl APIs:

- Unified NumberFormat: [polyfill](https://www.npmjs.com/package/@formatjs/intl-unified-numberformat) & [spec](https://github.com/tc39/proposal-unified-intl-numberformat)
- DisplayNames: [polyfill][displaynames-polyfill] & [spec][displaynames-spec]

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

- [`injectIntl`](API.md#injectintl)
- [`defineMessages`](API.md#definemessages)
- [`IntlProvider`](Components.md#intlprovider)
- [`FormattedDate`](Components.md#formatteddate)
- [`FormattedTime`](Components.md#formattedtime)
- [`FormattedRelativeTime`](Components.md#formattedrelativetime)
- [`FormattedNumber`](Components.md#formattednumber)
- [`FormattedPlural`](Components.md#formattedplural)
- [`FormattedMessage`](Components.md#formattedmessage)

**Note:** When using the UMD version of React Intl _without_ a module system, it will expect `react` to exist on the global variable: **`React`**, and put the above named exports on the global variable: **`ReactIntl`**.

## Creating an I18n Context

Now with React Intl and its locale data loaded an i18n context can be created for your React app.

React Intl uses the provider pattern to scope an i18n context to a tree of components. This allows configuration like the current locale and set of translated strings/messages to be provided at the root of a component tree and made available to the `<Formatted*>` components. This is the same concept as what Flux frameworks like [Redux](http://redux.js.org/) use to provide access to a store within a component tree.

**All apps using React Intl must use the [`<IntlProvider>` component](./Components.md#intlprovider).**

The most common usage is to wrap your root React component with `<IntlProvider>` and configure it with the user's current locale and the corresponding translated strings/messages:

```tsx
ReactDOM.render(
  <IntlProvider locale={usersLocale} messages={translationsForUsersLocale}>
    <App />
  </IntlProvider>,
  document.getElementById('container')
)
```

**See:** The [**`<IntlProvider>` docs**](./Components.md#intlprovider) for more details.

## Formatting Data

React Intl has two ways to format data, through [React components][components] and its [API][api]. The components provide an idiomatic-React way of integrating internationalization into a React app, and the `<Formatted*>` components have [benefits](./Components.md#why-components) over always using the imperative API directly. The API should be used when your React component needs to format data to a string value where a React element is not suitable; e.g., a `title` or `aria` attribute, or for side-effect in `componentDidMount`.

React Intl's imperative API is accessed via [**`injectIntl`**](API.md#injectintl), a High-Order Component (HOC) factory. It will wrap the passed-in React component with another React component which provides the imperative formatting API into the wrapped component via its `props`. (This is similar to the connect-to-stores pattern found in many Flux implementations.)

Here's an example using `<IntlProvider>`, `<Formatted*>` components, and the imperative API to setup an i18n context and format data:

```tsx
import React from 'react'
import ReactDOM from 'react-dom'
import {injectIntl, IntlProvider, FormattedRelative} from 'react-intl'

const PostDate = injectIntl(({date, intl}) => (
  <span title={intl.formatDate(date)}>
    <FormattedRelative value={date} />
  </span>
))

const App = ({post}) => (
  <div>
    <h1>{post.title}</h1>
    <p>
      <PostDate date={post.date} />
    </p>
    <div>{post.body}</div>
  </div>
)

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
)
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

If you're using `babel-loader`, or `ts-loader`, you can do 1 of the following:

1. Add those libraries in `include`:

```tsx
include: [
  path.join(__dirname, "node_modules/react-intl"),
  path.join(__dirname, "node_modules/intl-messageformat"),
  path.join(__dirname, "node_modules/intl-messageformat-parser"),
],
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

There are several [**runnable example apps**](https://github.com/formatjs/react-intl/tree/master/examples) in this Git repo. These are a great way to see React Intl's [core concepts](#core-concepts) in action in simplified applications.

# API Reference

There are a few API layers that React Intl provides and is built on. When using React Intl you'll be interacting with `Intl` built-ins, React Intl's API, and its React components:

- [ECMAScript Internationalization API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [React Intl API][api]
- [React Intl Components][components]

[api]: ./API.md
[components]: ./Components.md

# TypeScript Usage

`react-intl` is written in TypeScript, thus having 1st-class TS support.

In order to use `react-intl` in TypeScript, make sure your `compilerOptions`'s `lib` config include `["esnext.intl", "es2017.intl", "es2018.intl"]`.

# Advanced Usage

Our [Advanced Usage](./Advanced-Usage.md) has further guides for production setup in environments where performance is important.

# Supported Tooling

## Message extraction

We've built https://www.npmjs.com/package/@formatjs/cli that helps you extract messages from a list of files. It uses [`babel-plugin-react-intl`](https://www.npmjs.com/package/babel-plugin-react-intl) under the hood and should be able to extract messages if you're declaring using 1 of the mechanisms below:

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

We've also built https://www.npmjs.com/package/eslint-plugin-formatjs that helps enforcing specific rules on your messages if your translation vendor has restrictions.
