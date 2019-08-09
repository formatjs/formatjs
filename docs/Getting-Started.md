# Getting Started

<!-- toc -->

- [Introduction](#introduction)
  - [Intro Guides](#intro-guides)
  - [I18n in JavaScript](#i18n-in-javascript)
  - [The `react-intl` Package](#the-react-intl-package)
    - [Module Bundlers](#module-bundlers)
  - [The React Intl Module](#the-react-intl-module)
  - [Runtime Requirements](#runtime-requirements)
    - [Browser](#browser)
    - [Node.js](#nodejs)
    - [React Native](#react-native)
  - [Creating an I18n Context](#creating-an-i18n-context)
  - [Formatting Data](#formatting-data)
- [Core Concepts](#core-concepts)
- [Example Apps](#example-apps)
- [API Reference](#api-reference)

<!-- tocstop -->

# Introduction

## Intro Guides

Internationalizing web apps is an involved and complex task. If you're new to i18n in JavaScript, it's recommended that you start by reading the following guides:

- [Basic Internationalization Principles](http://formatjs.io/guides/basic-i18n/)
- [Runtime Environments](http://formatjs.io/guides/runtime-environments/)
- [Internationalization Tutorial From Smashing Magazine](https://www.smashingmagazine.com/2017/01/internationalizing-react-apps/)

## I18n in JavaScript

**React Intl uses and builds on the [Internationalization API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) built-in to JavaScript.**

These APIs are in all modern browsers (http://caniuse.com/#search=Intl) and Node.js since 0.12.

For older browsers and Node you might need to polyfill the `Intl` APIs. The [Runtime Environments guide](http://formatjs.io/guides/runtime-environments/) provides an overview of doing this, and here's some specific info:

- For older browsers we recommend using the [`intl`](https://www.npmjs.com/package/intl) package on npm. Which can be used via [unpkg](https://unpkg.com/) or [polyfill.io](http://cdn.polyfill.io/v2/docs/).

- By default Node only ships with basic English locale data. You can however [build a Node binary with all locale data](https://github.com/nodejs/node/wiki/Intl). We recommend doing this if you control the container your Node app runs in, otherwise you'll want to [polyfill `Intl` in Node](http://formatjs.io/guides/runtime-environments/#server).

- When polyfilling `Intl` in a browser, you'll want to dynamically load the locale data for the current user's locale. The Intl polyfill contains this data as separate `.js` files from the core implementation. In Node, the polyfill loads all locale data into memory by default.

## The `react-intl` Package

Install the [`react-intl` npm package](https://www.npmjs.com/package/react-intl) via npm:

```bash
$ npm install react-intl --save
```

The `react-intl` npm package distributes the following modules (links from [unpkg](https://unpkg.com/)):

- [**CommonJS**](https://unpkg.com/react-intl@latest/dist/index.js):
  unbundled dependencies, `"main"` in `package.json`, warnings in dev.
- [**ES6**](https://unpkg.com/react-intl@latest/dist/index.mjs):
  unbundled dependencies, `"jsnext:main"` and `"module"` in `package.json`, warnings in dev.
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
- [`FormattedHTMLMessage`](Components.md#formattedhtmlmessage)

**Note:** When using the UMD version of React Intl _without_ a module system, it will expect `react` to exist on the global variable: **`React`**, and put the above named exports on the global variable: **`ReactIntl`**.

## Runtime Requirements

React Intl relies on these `Intl` APIs:

- [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat): Available on IE11+
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat): Available on IE11+
- [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules): This can be polyfilled using [this package](https://www.npmjs.com/package/intl-pluralrules).
- [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat): This can be polyfilled using [this package](https://www.npmjs.com/package/@formatjs/intl-relativetimeformat).

If you need to support older browsers, we recommend you do the following:

1. If you're supporting browsers that do not have [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules) (e.g IE11 & Safari 12-), include this [polyfill](https://www.npmjs.com/package/intl-pluralrules) in your build.
2. If you're supporting browsers that do not have [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat) (e.g IE11, Edge, Safari 12-), include this [polyfill](https://www.npmjs.com/package/@formatjs/intl-relativetimeformat) in your build along with individual CLDR data for each locale you support.

```js
import '@formatjs/intl-relativetimeformat/polyfill';
import '@formatjs/intl-relativetimeformat/dist/include-aliases'; // Optional, if you care about edge cases in locale resolution, e.g zh-CN -> zh-Hans-CN
import '@formatjs/intl-relativetimeformat/dist/locale-data/de'; // Add locale data for de
```

### Browser

We officially support IE11 along with modern browsers (Chrome/FF/Edge/Safari).

### Node.js

When using React Intl in Node.js, your `node` binary has to either:

- Get compiled with `full-icu` using these [instructions](https://nodejs.org/api/intl.html)

**OR**

- Uses [`full-icu` npm package](https://www.npmjs.com/package/full-icu)

If your `node` version is missing any of the `Intl` APIs above, you'd have to polyfill them accordingly.

We also rely on `DOMParser` to format rich text, thus for Node will need to polyfill using [xmldom](https://github.com/jindw/xmldom).

### React Native

If you're using `react-intl` in React Native, make sure your runtime has built-in `Intl` support (similar to [JSC International variant](https://github.com/react-native-community/jsc-android-buildscripts#international-variant)). See these issues for more details:

- https://github.com/formatjs/react-intl/issues/1356
- https://github.com/formatjs/react-intl/issues/992

We also rely on `DOMParser` to format rich text, thus for JSC will need to polyfill using [xmldom](https://github.com/jindw/xmldom).

## Creating an I18n Context

Now with React Intl and its locale data loaded an i18n context can be created for your React app.

React Intl uses the provider pattern to scope an i18n context to a tree of components. This allows configuration like the current locale and set of translated strings/messages to be provided at the root of a component tree and made available to the `<Formatted*>` components. This is the same concept as what Flux frameworks like [Redux](http://redux.js.org/) use to provide access to a store within a component tree.

**All apps using React Intl must use the [`<IntlProvider>` component](./Components.md#intlprovider).**

The most common usage is to wrap your root React component with `<IntlProvider>` and configure it with the user's current locale and the corresponding translated strings/messages:

```js
ReactDOM.render(
  <IntlProvider locale={usersLocale} messages={translationsForUsersLocale}>
    <App />
  </IntlProvider>,
  document.getElementById('container')
);
```

**See:** The [**`<IntlProvider>` docs**](./Components.md#intlprovider) for more details.

## Formatting Data

React Intl has two ways to format data, through [React components][components] and its [API][api]. The components provide an idiomatic-React way of integrating internationalization into a React app, and the `<Formatted*>` components have [benefits](./Components.md#why-components) over always using the imperative API directly. The API should be used when your React component needs to format data to a string value where a React element is not suitable; e.g., a `title` or `aria` attribute, or for side-effect in `componentDidMount`.

React Intl's imperative API is accessed via [**`injectIntl`**](API.md#injectintl), a High-Order Component (HOC) factory. It will wrap the passed-in React component with another React component which provides the imperative formatting API into the wrapped component via its `props`. (This is similar to the connect-to-stores pattern found in many Flux implementations.)

Here's an example using `<IntlProvider>`, `<Formatted*>` components, and the imperative API to setup an i18n context and format data:

```js
import React from 'react';
import ReactDOM from 'react-dom';
import {injectIntl, IntlProvider, FormattedRelative} from 'react-intl';

const PostDate = injectIntl(({date, intl}) => (
  <span title={intl.formatDate(date)}>
    <FormattedRelative value={date} />
  </span>
));

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
