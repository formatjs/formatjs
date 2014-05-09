React Intl Mixin
================

This repository contains a [ReactJS][] Component Mixin to implement Internationalization
features in a react component. The Intl Mixin provides a series of methods that
can be used in the `render()` method of the component to provide date formatting,
number formatting, as well as plural and gender based translations.

## Overview

The `ReactIntlMixin` implements a [ReactJS][] Component [Mixin][] that adds three new methods to any React component, these method are:

 * `intlDate()` to format a date value
 * `intlNumber()` to format a numeric value
 * `intlMessage()` to format a complex i18n message

In the case of `intlDate()` and `intlNumber()`, they are just sugar on top of `new [Intl.NumberFormat][]()` and `new [Intl.DateTimeFormat][]()` implemented by most modern browsers, it also add some caching mechanism to reuse the instances when possible to avoid a performance penalty of creating those objects over and over again, which happens to be very slow due to the machinery associated with it.

But `intlMessage()` is a far more interested piece, and it follows the same principle of defining a sugar layer on top of [intl-messageformat][], which is a library to support more advanced translation patterns that included complex pluralization and gender support. This library is based on the [Strawman Draft][] that is set to evolve [ECMAScript 402][] to provides a standardized way to concatenate strings with localization support in JavaScript.

In general, `intlMessage()` provides many different ways to add translations to any render process in your application, and provides the right hooks for your application to implement i18n in an effective way, including the ability to cache expensive objects created through `new IntlMessageFormat(pattern, locale, [optFieldFormatters])` to avoid string manipulations during the runtime process.

The patterns consumed by `intlMessage()` are the patterns supported by [intl-messageformat][], which is one of the industry standards used in other languages like Java and PHP, and it is a format that professional translators know how to handle. You can learn more about this format here: https://github.com/yahoo/intl-messageformat#how-it-works

## Installation

### Browser

1. Install with [bower][]: `bower install react-intl`
2. Load the scripts into your page.

```html
<script src="path/to/react.js"></script>
<script src="path/to/intl-messageformat.complete.js"></script>
<script src="path/to/react-intl.js"></script>
```

_note: for older browsers, and safari, you might need to also load [Intl.js][] polyfill before
including [intl-messageformat][] library._

3. Creating a React component with the Intl mixin:

```javascript
var MyComponent = React.createClass({
  mixins: [ReactIntlMixin],
  getMyMessage: function () {
    return "{product} will cost {price, number} if ordered by {deadline, date}"
  },
  render: function () {
    return <div>
      <p>{this.intlDate(new Date())}</p>
      <p>{this.intlNumber(600)}</p>
      <p>{this.intlMessage(this.getMyMessage(), {
        product: 'Mac Mini',
        price: 2000.0015,
        deadline: 1390518044403
      })}</p>
    </div>;
  }
});
```

4. Using the React component by specifying the `locales`:


```javascript
React.renderComponent(
  <MyComponent locales={["fr-FR"]}/>,
  document.getElementById('example')
);
```

### Node/CommonJS

1. You can install the mixin with npm: `npm install react-intl`
2. Load in the module and register it:

```javascript
var ReactIntlMixin = require('react-intl');
```

## Advanced Options

### Date and Time formatters

#### Explicit formats

By default, when using `{this.intlDate(new Date())}` and `{this.intlNumber(600)}`, `react-intl` will use the default format for the data, and the default numeric format for the number. To specify a custom format, you have two ways, passing a second argument with the specific format you want to use. The following examples will ilustrate this option:

```javascript
var MyComponent = React.createClass({
  mixins: [ReactIntlMixin],
  render: function () {
    return <div>
        <p>A: {this.intlDate(1390518044403, { hour: 'numeric', minute: 'numeric' })}</p>
        <p>B: {this.intlNumber(400, { style: 'percent' })}</p>
    </div>;
  }
});
```

In the example above, if `locales` is set to `["fr-FR"]`, the output will be:

```html
A: 18:00
B: 40 000 %
```

But if `locales` is set to `["en-US"]`, the output will be:

```html
A: 6:00 PM
B: 40,000%
```

This explicit way to specify a format works well for simple cases, but for complex applications, it falls short because you will have to pass these values everywhere. Also, it doesn't work with complex structures processed by `intlMessage()` because there is no way to pass the formatter for each individual element. To overcome this limitation, we introduced the custom formatters.


#### Custom formats

With custom formatters, you can specify a set of rules that can be apply to your entire application, or for a section of the page (a component and its child components). These custom formatters can also be used thru `intlMessage()` API for complex language sentences. The following examples will ilustrate this option:

```javascript
var MyContainer = React.createClass({
  mixins: [ReactIntlMixin],
  getDefaultProps: function() {
    return {

      // hardcoding formats as properties, but they can be passed from parent...
      "formats": {
        "date": {
          "timeStyle": {
            "hour": "numeric",
            "minute": "numeric"
          }
        },
        "number": {
          "percentStyle": {
            "style": "percent"
          },
          "eur": {
            "style": "currency",
            "currency": "EUR"
          }
        }
      },

      // using properties or a mixin to bring the messages in different languages...
      "MyMessage": "{product} will cost {price, number, eur} if ordered by {deadline, date, timeStyle}"

    };
  },
  render: function () {
    return <div>
        <p>A: {this.intlDate(1390518044403, "timeStyle")}</p>
        <p>B: {this.intlNumber(400, "percentStyle")}</p>
        <p>{this.intlMessage(this.props.MyMessage, {
          product: 'Mac Mini',
          price: 2000.0015,
          deadline: 1390518044403
        })}</p>
    </div>;
  }
});
```

In the example above, if `locales` is set to `["fr-FR"]`, the output will be:

```html
A: 6:00 PM
B: 40,000%
C: Mac Mini will cost €200 if ordered by 6:00 PM
```

By having defined `this.props.formats`, which specifies a set of named formats under `date` and `number` members, allow us to use those named formats as a second argument for `intlNumber()` and `intlDate()`, but also allow us to reference them as a third token when defining the messages, e.g: `{deadline, date, timeStyle}`, which describes the format options for `deadline` value, specifying that it is a `date` and should be formatted using `timeStyle` custom formatter.

### App Configuration

Another feature of the Intl Mixin is its ability to propagate `formats` and `locales` to any child component. Internally, it laverages `context` to allow those child components to reuse the values defined at the parent level, making this ideal to define custom formatters for the app, and the language or the application by defining them or passing them into the root component when rendering the application. Ideally, you will do this:

```javascript
var appLocales = ['en-US'];
var appFormats = { number: {}, date: {} };
React.renderComponent(
  <MyRootComponent locales={appLocales} formats={appFormats} />,
  document.getElementById('container')
);
```

Then make sure `MyRootComponent` implement the `ReactIntlMixin`. By doing that, you can define the list of `locales`, normally one or more in case you want to support fallback, (e.g.: `["fr-FR", "en"]`); and you can define the `formats` to describe how the application will format dates and numbers. And all child components will be able to inherit these two structures in such a way that you don't have to propagate or define `locales` or `formats` at any level in your application, just apply this mixin in those components that are suppose to use `this.intlNumber()`, `this.intlDate()` and/or `this.intlMessage()` in the `render()` method and you're all set.

Limitations
-----------

Not all browsers have implemented [ECMAScript 402][], which is the internationalization API, for older browsers, and Safari, you might need to patch the browser by loading [Intl.js][] polyfill before
including [intl-messageformat][] library.

[Intl.js]: https://github.com/andyearnshaw/Intl.js
[ECMAScript 402]: http://www.ecma-international.org/ecma-402/1.0/
[ReactJS]: http://facebook.github.io/react/
[Mixin]: http://facebook.github.io/react/docs/reusable-components.html#mixins
[bower]: http://bower.io/
[intl-messageformat]: https://github.com/yahoo/intl-messageformat
[Intl.NumberFormat]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat
[Intl.DateTimeFormat]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
[Strawman Draft]: http://wiki.ecmascript.org/doku.php?id=globalization:messageformatting
