# Getting Started

- [Introduction](#introduction)
- [Core Concepts](#core-concepts)
- [Example Apps](#example-apps)
- [API Reference](#api-reference)

## Introduction

- [Intro Guides](#intro-guides)
- [I18n in JavaScript](#i18n-in-javascript)
- [The `react-intl` Package](#the-react-intl-package)
  - [Module Bundlers](#module-bundlers)
- [The React Intl Module](#the-react-intl-module)
- [Loading Locale Data](#loading-locale-data)
  - [Locale Data in Node.js](#locale-data-in-nodejs)
  - [Locale Data in Browsers](#locale-data-in-browsers)
- [Creating an I18n Context](#creating-an-i18n-context)
- [Formatting Data](#formatting-data)

### Intro Guides

Internationalizing web apps is an involved and complex task. If you're new to i18n in JavaScript, it's recommended that you start by reading the following guides:

- [Basic Internationalization Principles](http://formatjs.io/guides/basic-i18n/)
- [Runtime Environments](http://formatjs.io/guides/runtime-environments/)
- [Internationalization Tutorial From Smashing Magazine](https://www.smashingmagazine.com/2017/01/internationalizing-react-apps/)

### I18n in JavaScript

**React Intl uses and builds on the [Internationalization API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) built-in to JavaScript.**

These APIs are in all modern browsers (http://caniuse.com/#search=Intl) and Node.js since 0.12.

For older browsers and Node you might need to polyfill the `Intl` APIs. The [Runtime Environments guide](http://formatjs.io/guides/runtime-environments/) provides an overview of doing this, and here's some specific info:

- For older browsers we recommend using the [`intl`](https://www.npmjs.com/package/intl) package on npm. Which can be used via [unpkg](https://unpkg.com/) or [polyfill.io](http://cdn.polyfill.io/v2/docs/).

- By default Node only ships with basic English locale data. You can however [build a Node binary with all locale data](https://github.com/nodejs/node/wiki/Intl). We recommend doing this if you control the container your Node app runs in, otherwise you'll want to [polyfill `Intl` in Node](http://formatjs.io/guides/runtime-environments/#server).

- When polyfilling `Intl` in a browser, you'll want to dynamically load the locale data for the current user's locale. The Intl polyfill contains this data as separate `.js` files from the core implementation. In Node, the polyfill loads all locale data into memory by default.

### The `react-intl` Package

Install the [`react-intl` npm package](https://www.npmjs.com/package/react-intl) via npm:

```bash
$ npm install react-intl --save
```

The `react-intl` npm package distributes the following modules (links from [unpkg](https://unpkg.com/)):

- [**CommonJS**](https://unpkg.com/react-intl@latest/lib/index.js):
  unbundled dependencies, `"main"` in `package.json`, warnings in dev.
- [**ES6**](https://unpkg.com/react-intl@latest/lib/index.es.js):
  unbundled dependencies, `"jsnext:main"` and `"module"` in `package.json`, warnings in dev.
- [**UMD dev**](https://unpkg.com/react-intl@latest/dist/react-intl.js):
  bundled dependencies (except `react`), browser or Node, warnings.
- [**UMD prod**](https://unpkg.com/react-intl@latest/dist/react-intl.min.js):
  minified, bundled dependencies (except `react`), browser or Node, no warnings.
- [**UMD Locale Data**](https://unpkg.com/react-intl@latest/locale-data/):
  grouped by language, browser or Node, `index.js` contains all locales.

**Note:** React Intl's locale data is in a directory at the package's root. This allows the locale data to be `import`-ed or `require`-d relative to the package. For example:

```js
import englishLocaleData from 'react-intl/locale-data/en';
```

#### Module Bundlers

We've made React Intl work well with module bundlers like: Browserify, Webpack, or Rollup which can be used to bundle React Intl for the browser:

- The `"browser"` field in `package.json` is specified so that only basic English locale data is included when bundling. This way when using the `"main"` module in Node all locale data is loaded, but ignored when bundled for the browser.

- An ES6 version of React Intl is provided as `"jsnext:main"` and `"module"` in `package.json` and can be used with Rollup.

- Development-time warnings are wrapped with `process.env.NODE_ENV !== 'production'`, this allows you to specify `NODE_ENV` when bundling and minifying to have these code blocks removed.

### The React Intl Module

Whether you use the ES6, CommonJS, or UMD version of React Intl, they all provide the same named exports:

- [`addLocaleData`](API.md#addlocaledata)
- [`injectIntl`](API.md#injectintl)
- [`defineMessages`](API.md#definemessages)
- [`IntlProvider`](Components.md#intlprovider)
- [`FormattedDate`](Components.md#formatteddate)
- [`FormattedTime`](Components.md#formattedtime)
- [`FormattedRelative`](Components.md#formattedrelative)
- [`FormattedNumber`](Components.md#formattednumber)
- [`FormattedPlural`](Components.md#formattedplural)
- [`FormattedMessage`](Components.md#formattedmessage)
- [`FormattedHTMLMessage`](Components.md#formattedhtmlmessage)

**Note:** When using the UMD version of React Intl _without_ a module system, it will expect `react` to exist on the global variable: **`React`**, and put the above named exports on the global variable: **`ReactIntl`**.

### Loading Locale Data

React Intl relies on locale data to support its plural and relative-time formatting features. This locale data is split out from the main library because it's 39KB gz, and instead grouped per **language**; e.g., `en.js`, `fr.js`, `zh.js`, etc.

If you are targeting browsers or Node versions which don't have the `Intl` APIs built-in, you'll need to polyfill the runtime using the Intl.js polyfill ([See above for details](#i18n-in-javascript).) This polyfill also has its locale data separated into files that are organized by **locale tag**; e.g., `en-US.js`, `fr.js`, `zh-Hant-TW.js`, etc.

Because of these differences in how the locale data is organized, you'll need to put extra attention on the locale data files available for the Intl.js polyfill and React Intl when loading locale data dynamically.

#### Locale Data in Node.js

When using React Intl in Node.js (same for the Intl.js polyfill), **all locale data will be loaded into memory.** This makes it easier to write a universal/isomorphic React app with React Intl since you won't have to worry about dynamically loading locale data on the server.

**Note:** As mentioned [above](#module-bundlers), when using Browserify/Webpack/Rollup to bundle React Intl for the browser, only basic English locale data will be included.

#### Locale Data in Browsers

When using React Intl in browsers, it will only contain locale data for basic English by default. **This means you'll need to either bundle locale data with your app code, or dynamically load a [locale data UMD module](#the-react-intl-package) based on the current user's locale.**

React Intl provides an [**`addLocaleData` API**](./API.md#addlocaledata) which can be passed the contents of a locale data module and will register it in its locale data registry.

If your app only supports a few languages, we recommend bundling React Intl's locale data for those languages with your app code as this approach is simpler. Here's an example of an app that supports English, French, and Spanish:

```js
// app.js
import {addLocaleData} from 'react-intl';
import en from 'react-intl/locale-data/en';
import fr from 'react-intl/locale-data/fr';
import es from 'react-intl/locale-data/es';

addLocaleData([...en, ...fr, ...es]);
// ...
```

If your app supports many locales, you can also dynamically load the locale data needed for the current user's language. This would involve outputting a different HTML document per users which includes a `<script>` to the correct locale data file. When loading a locale data file in a runtime _without_ a module system, it will be added to a global variable: **`ReactIntlLocaleData`**. Here's an example of loading React Intl and locale data for a French user:

```html
<!-- Load React and ReactDOM if they're not already on the page. -->
<script src="https://unpkg.com/react@latest/dist/react.min.js"></script>
<script src="https://unpkg.com/react-dom@latest/dist/react-dom.min.js"></script>

<!-- Load ReactIntl and its locale data for French. -->
<script src="https://unpkg.com/react-intl@latest/dist/react-intl.min.js"></script>
<script src="https://unpkg.com/react-intl@latest/locale-data/fr.js"></script>
<script>
  ReactIntl.addLocaleData(ReactIntlLocaleData.fr);
</script>
```

**Note:** Since `ReactIntl` and `ReactIntlLocaleData` are separate global variables they are decoupled and this means you could set the `async` attribute on the `<script src="">` scripts.

### Creating an I18n Context

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

### Formatting Data

React Intl has two ways to format data, through [React components][components] and its [API][api]. The components provide an idiomatic-React way of integrating internationalization into a React app, and the `<Formatted*>` components have [benefits](./Components.md#why-components) over always using the imperative API directly. The API should be used when your React component needs to format data to a string value where a React element is not suitable; e.g., a `title` or `aria` attribute, or for side-effect in `componentDidMount`.

React Intl's imperative API is accessed via [**`injectIntl`**](API.md#injectintl), a High-Order Component (HOC) factory. It will wrap the passed-in React component with another React component which provides the imperative formatting API into the wrapped component via its `props`. (This is similar to the connect-to-stores pattern found in many Flux implementations.)

Here's an example using `<IntlProvider>`, `<Formatted*>` components, and the imperative API to setup an i18n context and format data:

```js
import React, {PropTypes} from 'react';
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

## Core Concepts

- Locale data
- Formatters (Date, Number, Message, Relative)
- Provider and Injector
- API and Components
- Message Descriptor
- Message Syntax
- Defining default messages for extraction
- Custom, named formats

## Example Apps

There are several [**runnable example apps**](https://github.com/formatjs/react-intl/tree/master/examples) in this Git repo. These are a great way to see React Intl's [core concepts](#core-concepts) in action in simplified applications.

## API Reference

There are a few API layers that React Intl provides and is built on. When using React Intl you'll be interacting with `Intl` built-ins, React Intl's API, and its React components:

- [ECMAScript Internationalization API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [React Intl API][api]
- [React Intl Components][components]

[api]: ./API.md
[components]: ./Components.md
