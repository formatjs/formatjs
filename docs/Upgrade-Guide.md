# Upgrade Guide

## 3.0.0 [WIP]

- [Breaking API Changes](#breaking-api-changes)
- [Use React 16.3 and upwards](#use-react-163-and-upwards)
- [Migrate withRef to forwardRef](#migrate-withref-to-forwardref)
- [New useIntl hook as an alternative of injectIntl HOC](#new-useintl-hook-as-an-alternative-of-injectintl-hoc)
- [Migrate to using native Intl APIs](#migrate-to-using-native-intl-apis)
- [TypeScript Support](#typescript-support)

### Breaking API Changes

- `addLocaleData` has been removed. See [Migrate to using native Intl APIs](#migrate-to-using-native-intl-apis) for more details.
- `ReactIntlLocaleData` has been removed. See [Migrate to using native Intl APIs](#migrate-to-using-native-intl-apis) for more details.
- `intlShape` has been removed. See [TypeScript Support](#typescript-support) for more details.
- Change default `textComponent` in `IntlProvider` to `React.Fragment`. In order to keep the old behavior, you can explicitly set `textComponent` to `span`.
- `FormattedRelative` has been renamed to `FormattedRelativeTime` and its API has changed significantly. See [FormattedRelativeTime](#formattedrelativetime) for more details.
- `formatRelative` has been renamed to `formatRelativeTime` and its API has changed significantly. See [FormattedRelativeTime](#formattedrelativetime) for more details.

```tsx
<IntlProvider textComponent="span" />
```

### Use React 16.3 and upwards

React Intl v3 supports the new context API, fixing all kinds of tree update problems :tada:
In addition it makes use of the new lifecycle hooks (and gets rid of the [deprecated](https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html) ones).
It also supports the new `React.forwardRef()` enabling users to directly access refs using the standard `ref` prop (see beneath for further information).

### Migrate withRef to forwardRef

With the update to React `>= 16.3` we got the option to use the new `React.forwardRef()` feature and because of this deprecated the use of the `withRef` option for the `injectIntl` HOC in favour of `forwardRef`.
When `forwardRef` is set to true, you can now simply pretend the HOC wasn't there at all.

Intl v2:

```js
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

```js
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

### New useIntl hook as an alternative of injectIntl HOC

This v3 release also supports the latest React hook API for user with React `>= 16.8`. You can now take `useIntl` hook as an alternative to `injectIntl` HOC on _function components_. Both methods allow you to access the `intl` instance, here is a quick comparison:

```js
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

### Migrate to using native Intl APIs

React Intl v3 no longer comes with CLDR data and rely on native Intl API instead. Specifically the
new APIs we're relying on are:

- [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules): This can be polyfilled using [this package](https://www.npmjs.com/package/intl-pluralrules).
- [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat): This can be polyfilled using [this package](https://www.npmjs.com/package/@formatjs/intl-relativetimeformat).

This shift is meant to future-proof React Intl as these APIs are all stable and being implemented in modern browsers. This also means we no longer package and consume CLDRs in this package.

If you previously were using `addLocaleData` to support older browsers, we recommend you do the following:

1. If you're supporting browsers that do not have [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules) (e.g IE11 & Safari 12-), include this [polyfill](https://www.npmjs.com/package/intl-pluralrules) in your build.
2. If you're supporting browsers that do not have [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat) (e.g IE11, Edge, Safari 12-), include this [polyfill](https://www.npmjs.com/package/@formatjs/intl-relativetimeformat) in your build along with individual CLDR data for each locale you support.

```js
import '@formatjs/intl-relativetimeformat/polyfill';
import '@formatjs/intl-relativetimeformat/dist/locale-data/de'; // Add locale data for de
```

When using React Intl in Node.js, your `node` binary has to either:

- Get compiled with `full-icu` using these [instructions](https://nodejs.org/api/intl.html)

**OR**

- Uses [`full-icu` npm package](https://www.npmjs.com/package/full-icu)

### TypeScript Support

`react-intl` has been rewritten in TypeScript and thus has native TypeScript support. Therefore, we've also removed `prop-types` dependency and expose `IntlShape` as an interface instead.

All types should be available from top level `index` file without importing from specific subfiles. For example:

```ts
import {IntlShape} from 'react-intl'; // Correct
import {IntlShape} from 'react-intl/lib/types'; // Incorrect
```

If we're missing any interface top level support, please let us know and/or submitting a PR is greatly appreciated :)

### FormattedRelativeTime
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
<FormattedRelativeTime value={2} numeric="auto" unit="second" style="narrow" updateIntervalInSeconds={1} /> 
// Initially prints: `in 2s`
// 1 second later: `in 1s`
// 1 second later: `now`
// 1 second later: `1s ago`
// 60 seconds later: `1m ago`
```

6. `initialNow` has been removed.

Similarly, the functional counterpart of this component which is `formatRelative` has been renamed to `formatRelativeTime` and its parameters have been changed to reflect this component's props accordingly.

## 2.0.0

- [Use React 0.14 or 15](#use-react-014-or-15)
- [Update How Locale Data is Added](#update-how-locale-data-is-added)
- [Remove Intl Mixin](#remove-intl-mixin)
- [Change How Messages are Formatted](#change-how-messages-are-formatted)
- [Update How Relative Times are Formatted](#update-how-relative-times-are-formatted)

### Use React 0.14 or 15

React Intl v2 has a peer dependency on `react@^0.14.0 || ^15.0.0-0` and now takes advantage of features and changes in React 0.14 and also works with React 15.

### Update How Locale Data is Added

The locale data modules in React Intl v2 have been refactored to _provide_ data, instead of mutating React Intl's internal locale data registry. The `react-intl/locale-data/*` files are also decoupled from the `ReactIntl` global and instead provide UMD modules with a new `ReactIntlLocaleData` global. These changes, mean apps need update how they are registering the locale data they need in the browser.

#### Add Call to `addLocaleData()` in Browser

There is now an [`addLocaleData()`](API.md#addlocaledata) function that needs to be called with the locale data that has been loaded. You can do the following in your main client JavaScript entry point:

This assumes a locale data `<script>` is added based on the request; e.g., for French speaking users:

```html
<script src="react-intl/locale-data/fr.js"></script>
```

**Using `<script src="react-intl/dist/react-intl.js>`:**

```js
if ('ReactIntl' in window && 'ReactIntlLocaleData' in window) {
  Object.keys(ReactIntlLocaleData).forEach(lang => {
    ReactIntl.addLocaleData(ReactIntlLocaleData[lang]);
  });
}
```

**Using Browserify/Webpack to Load React Intl:**

```js
import {addLocaleData} from 'react-intl';

if ('ReactIntlLocaleData' in window) {
  Object.keys(ReactIntlLocaleData).forEach(lang => {
    addLocaleData(ReactIntlLocaleData[lang]);
  });
}
```

**Note:** This decoupling of the library from the locale data, allows for the files to be loaded via `<script async>`. When using async scripts, your client bootstrapping code will need to wait for the `load` event, including the code above.

### Remove Intl Mixin

**The `IntlMixin` has been removed from React Intl v2.** The mixin did two things: it automatically propagated `locales`, `formats`, and `messages` throughout an app's hierarchy, and it provided an imperative API via `format*()` functions. These jobs are now handled by [`<IntlProvider>`](Components#intlprovider) and [`injectIntl()`](API.md#injection-api), respectively:

#### Update to `<IntlProvider>`

In React Intl v1, you would add the `IntlMixin` to your root component; e.g., `<App>`. Remove the `IntlMixin` and instead wrap your root component with [`<IntlProvider>`](Components#intlprovider):

```js
import ReactDOM from 'react-dom';
import {IntlProvider} from 'react-intl';

ReactDOM.render(
  <IntlProvider locale="en">
    <App />
  </IntlProvider>,
  document.getElementById('container')
);
```

**Note:** The `locale` prop is **singular**, required, and only accepts a string value. This is a simplification of the plural `locales` prop used by the `IntlMixin`.

#### Update to `injectIntl()`

The `IntlMixin` also provided the imperative API for custom components to use the `format*()` methods; e.g., `formatDate()` to get formatted strings for using in places like `title` and `aria` attribute. Remove the `IntlMixin` and instead use the [`injectIntl()`](API.md#injectintl) Hight Order Component (HOC) factory function to inject the imperative API via `props`.

Here's an example of a custom `<RelativeTime>` stateless component which uses `injectIntl()` and the imperative [`formatDate()`](API.md#formatdate) API:

```js
import React from 'react';
import {injectIntl, FormattedRelative} from 'react-intl';

const to2Digits = num => `${num < 10 ? `0${num}` : num}`;

const RelativeTime = ({date, intl}) => {
  date = new Date(date);

  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  let formattedDate = intl.formatDate(date, {
    year: 'long',
    month: 'numeric',
    day: 'numeric',
  });

  return (
    <time
      dateTime={`${year}-${to2Digits(month)}-${to2Digits(day)}`}
      title={formattedDate}
    >
      <FormattedRelative value={date} />
    </time>
  );
};

export default injectIntl(RelativeTime);
```

`injectIntl()` is similar to a `connect()` HOC factory function you might find in a Flux framework to connect a component to a store.

### Change How Messages are Formatted

**The way string messages are formatted in React Intl v2 has changed significantly!** This is the most disruptive set of change when upgrading from v1 to v2; but it enables many great new features.

React Intl v2 introduces a new [**Message Descriptor**](API.md#message-descriptor) concept which can be used to define an app's default string messages. A Message Descriptor is an object with the following properties, `id` is the only required prop:

- **`id`**: A unique, stable identifier for the message
- **`description`**: Context for the translator about how it's used in the UI
- **`defaultMessage`**: The default message (probably in English)

**Note:** This upgrade guide will focus on using Message Descriptors that only contain an `id` property.

#### Flatten `messages` Object

React Intl v2 no longer supports nested `messages` objects, instead the collection of translated string messages passed to [`<IntlProvider>`](Components#intlprovider) must be flat. This is an explicit design choice which simplifies while increasing flexibility. React Intl v2 does not apply any special semantics to strings with dots; e.g., `"namespaced.string_id"`.

Apps using a nested `messages` object structure could use the following function to flatten their object according to React Intl v1's semantics:

```js
function flattenMessages(nestedMessages, prefix = '') {
  return Object.keys(nestedMessages).reduce((messages, key) => {
    let value = nestedMessages[key];
    let prefixedKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      messages[prefixedKey] = value;
    } else {
      Object.assign(messages, flattenMessages(value, prefixedKey));
    }

    return messages;
  }, {});
}

let messages = flattenMessages(nestedMessages);
```

**Note:** Message ids can still contain `"."`s, so the ids themselves remain the same, it's only the `messages` object structure that needs to change.

#### Replace `getIntlMessage()` Calls with Message Descriptors

The `getIntlMessage()` method that was provided by the `IntlMixin` has been removed in React Intl v2. It was simply a helper that interpreted a message id string with `"."`s by looking up the translated message in a nested `messages` object. With the removal of `IntlMixin` and the change to a flat `messages` object, this method has been removed.

All calls to `getIntlMessage()` need to be replaced with a Message Descriptor.

**Replace:**

```js
this.getIntlMessage('some.message.id');
```

**With:**

```js
{
  id: 'some.message.id';
}
```

#### Update `formatMessage()` Calls

A typical pattern when calling `formatMessage()` is to nest a call to `getIntlMessage()`. These can be easily updated:

**1.0:**

```js
let message = this.formatMessage(
  this.getIntlMessage('some.message.id'),
  values
);
```

**2.0:**

```js
let message = this.props.intl.formatMessage({id: 'some.message.id'}, values);
```

**Note:** In React Intl v2, the [`formatMessage()`](API.md#formatmessage) function is injected via [`injectIntl()`](API.md#injectintl).

#### Update `<FormattedMessage>` and `<FormattedHTMLMessage>` Instances

The props for these two components have completely changed in React Intl v2. Instead of taking a `message` prop and treating all other props as values to fill in placeholders in a message, [`<FormattedMessage>`](Components#formattedmessage) and [`<FormattedHTMLMessage>`](Components#formattedhtmlmessage) now the same props as a Message Descriptor plus a new `values` prop.

The new `values` prop groups all of the message's placeholder values together into an object.

The following example shows up to update a `<FormattedMessage>` instance to use the new props and remove the call to `getIntlMessage()`:

**1.0:**

```js
<FormattedMessage message={this.getIntlMessage('greeting')} name="Eric" />
```

**2.0:**

```js
<FormattedMessage id="greeting" values={{name: 'Eric'}} />
```

### Update How Relative Times are Formatted

Minor changes have been made to how the "now" reference time is specified when formatting relative times in React Intl v2. It's uncommon to specify this value outside of test code, so it might not exist in your app.

#### Rename `<FormattedRelative>`'s `now` Prop to `initialNow`

A new feature has been added to [`<FormattedRelative>`](Components#formattedrelative) instances in React Intl v2, they now "tick" and stay up to date. Since time moves forward, it was confusing to have a prop named `now`, so it has been renamed to `initialNow`. Any `<FormattedRelative>` instances that use `now` should update to prop name to `initialNow`:

**1.0:**

```js
<FormattedRelative value={date} now={otherDate} />
```

**2.0:**

```js
<FormattedRelative value={date} initialNow={otherDate} />
```

**Note:** The [`<IntlProvider>`](Components#intlprovider) component also has a `initialNow` prop which can be assigned a value to stabilize the "now" reference time for _all_ [`<FormattedRelative>`](Components#formattedrelative) instances. This is useful for universal/isomorphic apps to proper React checksums between the server and client initial render.

#### Merge `formatRelative()`'s Second and Third Arguments

The signature of the `formatRelative()` function has been aligned with the other `format*()` functions and in React Intl v2, it only accepts two arguments: `value` and `options`. To specify a "now" reference time, add it to the `options` argument, and remove the third `formatOptions` argument:

**1.0:**

```js
let relative = this.formatRelative(date, {units: 'hour'}, {now: otherDate});
```

**2.0:**

```js
let relative = this.props.intl.formatRelative(date, {
  units: 'hour',
  now: otherDate,
});
```

**Note:** In React Intl v2, the [`formatRelative()`](API.md#formatrelative) function is injected via [`injectIntl()`](API.md#injectintl).
