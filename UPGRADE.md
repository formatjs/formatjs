Upgrade Guide
=============

## `2.0.0`

### Use React 0.14

React Intl v2 has a peer dependency on `react@^0.14.0` and now takes advantage of features and changes in React 0.14.

### Update How Locale Data is Added

The locale data modules in React Intl v2 have been refactored to _provide_ data, instead of mutating React Intl's internal locale data registry. The `dist/locale-data/*` files are also decoupled from the `ReactIntl` global and instead provide UMD modules with a new `ReactIntlLocaleData` global. These changes, mean apps need update how they are registering the locale data they need in the browser.

#### Add Call to `addLocaleData()` in Browser

There is now an `addLocaleData()` function that needs to be called with the locale data that has been loaded. You can do the following in your main client JavaScript entry point:

This assumes a locale data `<script>` is added based on the request; e.g., for French speaking users:

```html
<script src="react-intl/dist/locale-data/fr.js"></script>
```

**Using `<script src="react-intl/dist/react-intl.js>`:**
```js
if ('ReactIntl' in window && 'ReactIntlLocaleData' in window) {
    Object.keys(ReactIntlLocaleData).forEach((lang) => {
        ReactIntl.addLocaleData(ReactIntlLocaleData[lang]);
    });
}
```

**Using Browserify/Webpack to Load React Intl:**
```js
import {addLocaleData} from 'react-intl';

if ('ReactIntlLocaleData' in window) {
    Object.keys(ReactIntlLocaleData).forEach((lang) => {
        addLocaleData(ReactIntlLocaleData[lang]);
    });
}
```

**Note:** This decoupling of the library from the locale data, allows for the files to be loaded via `<script async>`. When using async scripts, your client bootstrapping code will need to wait for the `load` event, including the code above.

### Remove Intl Mixin

**The `IntlMixin` has been removed from React Intl v2.** The mixin did two things: it automatically propagated `locales`, `formats`, and `messages` throughout an app's hierarchy, and it provided an imperative API via `format*()` functions. These jobs are now handled by `<IntlProivder>` and `injectIntl()`, respectively:

#### Update to `<IntlProvider>`

In React Intl v1, you would add the `IntlMixin` to your root component; e.g., `<App>`. Remove the `IntlMixin` and instead wrap your root component with `<IntlProvider>`:

```js
import ReactDOM from 'react-dom';
import {IntlProvider} from 'react-intl';

ReactDOM.render(
    <IntlProvider locale='en'>
        <App />
    </IntlProvider>,
    document.getElementById('container')
);
```

**Note:** The `locale` prop is **singular**, required, and only accepts a string value. This is a simplification of the plural `locales` prop used by the `IntlMixin`.

#### Update to `injectIntl()`

The `IntlMixin` also provided the imperative API for custom components to use the `format*()` methods; e.g., `formatDate()` to get formatted strings for using in places like `title` and `aria` attribute. Remove the `IntlMixin` and instead use the `injectIntl()` Hight Order Component (HOC) factory function to inject the imperative API via `props`.

Here's an example of a custom `<RelativeTime>` stateless component which uses `injectIntl()` and the imperative API:

```js
import React from 'react';
import {
    injectIntl,
    FormattedRelative,
} from 'react-intl';

const RelativeTime = ({date, intl}) => {
    let year  = intl.formatDate(date, {year: 'numeric'});
    let month = intl.formatDate(date, {month: '2-digit'});
    let day   = intl.formatDate(date, {day: '2-digit'});

    let formattedDate = intl.formatDate(date, {
        year : 'long',
        month: 'numeric',
        day  : 'numeric'
    });

    return (
        <time
            datetime={`${year}-${month}-${day}`}
            title={formattedDate}
        >
            <FormattedRelative value={date} />
        </time>
    );
};

export default injectIntl(RelativeTime);
```

`injectIntl()` is similar to a `connect()` HOC factory function you might find in a Flux framework to connect a component to a store.

## Change How Messages are Formatted

**The way string messages are formatted in React Intl v2 has changed significantly!** This is the most disruptive set of change when upgrading from v1 to v2; but it enables many great new features.

React Intl v2 introduces a new **Message Descriptor** concept which can be used to define an app's default string messages. A Message Descriptor is an object with the following properties, `id` is the only required prop:

- **`id`**: A unique, stable identifier for the message
- **`description`**: Context for the translator about how it's used in the UI
- **`defaultMessage`**: The default message (probably in English)

**Note:** This upgrade guide will focus on using Message Descriptors that only contain an `id` property.

### Flatten `messages` Object

React Intl v2 no longer supports nested `messages` objects, instead the collection of translated string messages passed to `<IntlProvider>` must be flat. This is an explicit design choice which simplifies while increasing flexibility. React Intl v2 does not apply any special semantics to strings with dots; e.g., `"namespaced.string_id"`.

Apps using a nested `messages` object structure could use the following function to flatten their object according to React Intl v1's semantics:

```js
function flattenMessages(nestedMessages, prefix = '') {
    return Object.keys(nestedMessages).reduce((messages, key) => {
        let value       = nestedMessages[key];
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

### Replace `getIntlMessage()` Calls with Message Descriptors

The `getIntlMessage()` method that was provided by the `IntlMixin` has been removed in React Intl v2. It was simply a helper that interpreted a message id string with `"."`s by looking up the translated message in a nested `messages` object. With the removal of `IntlMixin` and the change to a flat `messages` object, this method has been removed.

All calls to `getIntlMessage()` need to be replaced with a Message Descriptor.

**Replace:**
```js
this.getIntlMessage('some.message.id')
```

**With:**
```js
{id: 'some.message.id'}
```

#### Update `formatMessage()` Calls

A typical pattern when calling `formatMessage()` is to nest a call to `getIntlMessage()`. These can be easily updated:

**1.0:**
```js
let message = this.formatMessage(this.getIntlMessage('some.message.id'), values);
```

**2.0:**
```js
let message = this.props.intl.formatMessage({id: 'some.message.id'}, values);
```

**Note:** In React Intl v2, the `formatMessage()` function is injected via `injectIntl()`.

### Update `<FormattedMessage>` and `<FormattedHTMLMessage>` Instances

The props for these two components have completely changed in React Intl v2. Instead of taking a `message` prop and treating all other props as values to fill in placeholders in a message, `<FormattedMessage>` and `<FormattedHTMLMessage>` now the same props as a Message Descriptor plus a new `values` prop.

The new `values` prop groups all of the message's placeholder values together into an object.

The following example shows up to update a `<FormattedMessage>` instance to use the new props and remove the call to `getIntlMessage()`:

**1.0:**
```js
<FormattedMessage
    message={this.getIntlMessage('greeting')}
    name='Eric'
/>
```

**2.0:**
```js
<FormattedMessage
    id='greeting'
    values={{name: 'Eric'}}
/>
```

## Update How Relative Times are Formatted

Minor changes have been made to how the "now" reference time is specified when formatting relative times in React Intl v2. It's uncommon to specify this value outside of test code, so it might not exist in your app.

### Rename `<FormattedRelative>`'s `now` Prop to `initialNow`

A new feature has been added to `<FormattedRelative>` instances in React Intl v2, they now "tick" and stay up to date. Since time moves forward, it was confusing to have a prop named `now`, so it has been renamed to `initialNow`. Any `<FormattedRelative>` instances that use `now` should update to prop name to `initialNow`:

**1.0:**
```js
<FormattedRelative value={date} now={otherDate} />
```

**2.0:**
```js
<FormattedRelative value={date} initialNow={otherDate} />
```

**Note:** The `<IntlProvider>` component also has a `initialNow` prop which can be assigned a value to stabilize the "now" reference time for _all_ `<FormattedRelative>` instances. This is useful for universal/isomorphic apps to proper React checksums between the server and client initial render.

### Merge `formatRelative()`'s Second and Third Arguments

The signature of the `formatRelative()` function has been aligned with the other `format*()` functions and in React Intl v2, it only accepts two arguments: `value` and `options`. To specify a "now" reference time, add it to the `options` argument, and remove the third `formatOptions` argument:

**1.0:**
```js
let relative = this.formatRelative(date, {units: 'hour'}, {now: otherDate});
```

**2.0:**
```js
let relative = this.props.intl.formatRelative(date, {
    units: 'hour',
    now  : otherDate
});
```

**Note:** In React Intl v2, the `formatRelative()` function is injected via `injectIntl()`.
