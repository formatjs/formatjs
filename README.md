React Intl Mixin
================

This repository contains a [ReactJS][] Component Mixin to implement Internationalization features for a React component. The Intl Mixin provides a set of methods that can be used in the `render()` method of the component to provide date, number, and message formatting, as well as plural and gender based translations.

[![npm Version][npm-badge]][npm]
[![Dependency Status][david-badge]][david]


Overview
--------

The `ReactIntlMixin` implements a [ReactJS][] Component [Mixin][] that adds these new methods to any React component:

 * `formatDate()` to format a date value
 * `formatTime()` to format a date value with `time` formats
 * `formatRelative()` to format a date relative to now; e.g. "3 hours ago"
 * `formatNumber()` to format a numeric value
 * `formatMessage()` to format a complex message

`formatDate()`, `formatTime()`, and `formatNumber()` are sugar on top of [Intl.NumberFormat][] and [Intl.DateTimeFormat][] APIs implemented by most modern browsers. To improve runtime performance, React Intl Mixin uses an internal cache to reuse instances of `Intl.NumberFormat` and `Intl.DateTimeFormat` when possible.

`formatMessage()` is a sugar layer on top of [intl-messageformat][], a library to support more advanced translation patterns that include complex pluralization and gender support. This library is based on a [Strawman Draft][] proposing to evolve [ECMAScript 402][] to provide a standard way to format message strings with localization support in JavaScript.

The `formatMessage()` method accepts a string message and values to format it with. It too uses an internal cache to improve runtime performance by reusing `IntlMessageFormat` instances.

The data consumed by `formatMessage()` follows the same format supported by [intl-messageformat][], which is one of the industry standards used in other programming languages like Java and PHP. Although this format looks complex, professional translators are familiar with it. You can [learn more about this format](https://github.com/yahoo/intl-messageformat#how-it-works).

`formatRelative()` is similar to `formatMessage()` in that it's a sugar layer on top of a non-started library, [intl-relativeformat][], which takes a JavaScript date or timestamp, compares it with "now", and returns the formatted string; e.g., "3 hours ago".


Usage
-----

### `Intl` Dependency

This package assumes that the [`Intl`][Intl] global object exists in the runtime. `Intl` is present in all modern browsers _except_ Safari, and there's work happening to [integrate `Intl` into Node.js][Intl-Node].

**Luckly, there's the [Intl.js][] polyfill!** You will need to conditionally load the polyfill if you want to support runtimes which `Intl` is not already built-in.

#### Loading Intl.js Polyfill in a browser

If the browser does not already have the `Intl` APIs built-in, the Intl.js Polyfill will need to be loaded on the page along with the locale data for any locales that need to be supported:

```html
<script src="intl/Intl.min.js"></script>
<script src="intl/locale-data/jsonp/en-US.js"></script>
```

_Note: Modern browsers already have the `Intl` APIs built-in, so you can load the Intl.js Polyfill conditionally, by for checking for `window.Intl`._

#### Loading Intl.js Polyfill in Node.js

Conditionally require the Intl.js Polyfill if it doesn't already exist in the runtime. As of Node <= 0.10, this polyfill will be required.

```js
if (!global.Intl) {
    require('intl');
}
```

_Note: When using the Intl.js Polyfill in Node.js, it will automatically load the locale data for all supported locales._

### Browser

1. Install with [bower][]: `bower install react-intl`.
2. Load the scripts into your page.

```html
<script src="react/react.min.js"></script>
<script src="react-intl/react-intl.min.js"></script>
```

_Note: for older browsers and Safari you may need to also load the [Intl.js][] polyfill before including `react-intl.js`._

Be default, React Intl ships with the locale data for English built-in. When you need to format data in another locale, include its data; e.g., for French:

```html
<script src="react-intl/locale-data/fr.js"></script>
```

_Note: All 150+ locales supported use their root BCP 47 language tag; i.e., the part before the first hyphen (if any)._

3. Creating a React component with the Intl Mixin:

```javascript
var MyComponent = React.createClass({
  mixins: [ReactIntlMixin],

  render: function () {
    return <div>
      <p>{this.formatDate(new Date())}</p>
      <p>{this.formatNumber(600)}</p>
      <p>{this.formatMessage(this.getIntlMessage('product.info'), {
        product: 'Mac Mini',
        price: 2000.0015,
        deadline: 1390518044403
      })}</p>
    </div>;
  }
});
```

4. Using the React component by specifying `locales`:

```javascript
var i18n = {
  locales: ['en-US'],
  messages: {
    product: {
      info: '{product} will cost {price, number} if ordered by {deadline, date}'
    }
  }
};

React.renderComponent(
  <MyComponent locales={i18n.locales} messages={i18n.messages}/>,
  document.getElementById('example')
);
```

### Node/CommonJS

1. You can install the mixin with npm: `npm install react-intl`.
2. Load in the module and register it.

```javascript
var ReactIntlMixin = require('react-intl');
```

_Note: in Node.js, the data for all locales is pre-loaded._

Advanced Options
----------------

### Date and Time Formats

#### Explicit Formats

By default, when using `{this.formatDate(new Date())}` and `{this.formatNumber(600)}`, `react-intl` will use the default format for the date, and the default numeric format for the number. To specify a custom format you can pass in a second argument with the format you want to use. The following examples will illustrate this option:

```javascript
var MyComponent = React.createClass({
  mixins: [ReactIntlMixin],

  render: function () {
    return <div>
      <p>A: {this.formatDate(1390518044403, {
        hour: 'numeric',
        minute: 'numeric'
      })}</p>
      <p>B: {this.formatNumber(400, { style: 'percent' })}</p>
    </div>;
  }
});
```

In the example above, if `locales` is set to `["fr-FR"]`, the output will be:

```html
<div>
  <p>A: 18:00</p>
  <p>B: 40 000 %</p>
</div>
```

But if `locales` is set to `["en-US"]`, the output will be:

```html
<div>
  <p>A: 6:00 PM</p>
  <p>B: 40,000%</p>
</div>
```

This explicit way to specify a format works well for simple cases, but for complex applications, it falls short because you will have to pass these format config objects through the component hierarchy. Also, it doesn't work with complex structures processed by `formatMessage()` because there is no way to pass the format options for each individual element. To overcome this limitation, we introduced the concept of "custom formats".

#### Custom Formats

With custom format, you can name a set of options that can be used within the entire application or within a component subtree (a component and its child components). These custom formats will also be used by the `formatMessage()` method for complex messages. The following examples will illustrates how custom formats work.

```javascript
var MyContainer = React.createClass({
  mixins: [ReactIntlMixin],

  getDefaultProps: function() {
    return {
      // Hard-coding formats as properties, but they can be passed from the
      // parent component or outside of React.
      formats: {
        date: {
          timeStyle: {
            hour: "numeric",
            minute: "numeric"
          }
        },

        number: {
          percentStyle: {
            style: "percent"
          },
          EUR: {
            style: "currency",
            currency: "EUR"
          }
        }
      }
    };
  },

  render: function () {
    return <div>
      <p>A: {this.formatDate(1390518044403, "timeStyle")}</p>
      <p>B: {this.formatNumber(400, "percentStyle")}</p>
      <p>C: {this.formatMessage(this.getIntlMessage('product.info'), {
        product: 'Mac Mini',
        price: 2000.0015,
        deadline: 1390518044403
      })}</p>
    </div>;
  }
});
```

The component above will now be rendered with `locales` and `mesages` set externally:

```javascript
var i18n = {
  locales: ["en-US"],
  messages: {
    product {
      info: "{product} will cost {price, number, eur} if ordered by {deadline, date, timeStyle}"
    }
  }
};

React.renderComponent(
  <MyComponent locales={i18n.locales} messages={i18n.messages}/>,
  document.body
);
```

The above rendering of `MyComponent` will output:

```html
<div>
  <p>A: 6:00 PM</p>
  <p>B: 40,000%</p>
  <p>C: Mac Mini will cost €200 if ordered by 6:00 PM</p>
</div>
```

By defining `this.props.formats`, which specifies a set of named formats under `date` and `number` members, you can use those named formats as a second argument for `formatNumber()`, `formatDate()`, and `formatTime()`. You can also reference them as the third token when defining the messages, e.g: `{deadline, date, timeStyle}`. In this case `deadline` describes the format options for its value, specifying that it is a `date` and should be formatted using the `timeStyle` custom format.

### App Configuration

Another feature of the Intl Mixin is its ability to propagate `formats` and `locales` to any child component. Internally, it leverages the `context` to allow those child components to reuse the values defined at the parent level, making this ideal to define custom formats and the locale for the app by defining them or passing them into the root component when rendering the application. **This is always the recommended way to provide i18n message strings to the React component hierarchy.** Ideally, you will do this:

```javascript
var i18n = {
  locales: ['en-US'],
  formats: { number: {}, date: {}, time: {} },
  messages: {}
};

React.renderComponent(
  <MyRootComponent
    locales={i18n.locales}
    formats={i18n.formats}
    messages={i18n.messages} />,
  document.getElementById('container')
);
```

Then make sure `MyRootComponent` uses the `ReactIntlMixin`. By doing that, you can define the list of `locales`, normally one or more in case you want to support fallback, (e.g.: `["fr-FR", "en"]`); and you can define `formats` to describe how the application will format dates and numbers. You will also want to mass the `messages` for the current locale, since the string will be locale-specific. All child components will be able to inherit these three structures in such a way that you don't have to propagate or define them at each level in your application. Just apply this mixin in those components that are suppose to use `this.formatNumber()`, `this.formatDate()` and/or `this.formatMessage()` in the `render()` method and you're all set.


How to Use `formatMessage()`
----------------------------

### Example #1: Simple String Replacement

```javascript
var MyComponent = React.createClass({
  mixins: [ReactIntlMixin],

  render: function () {
    return <p>{this.formatMessage(this.getIntlMessage("reporting"), {
      employee: this.props.name,
      manager: this.props.manager
    })}</p>;
  }
});

var messages = {
    "en-US": {
      reporting: "{employee} reports to {manager}."
    },

    "de-DE": {
      reporting: "{employee} berichtet an {manager}."
    }
};

// Render in English:
React.renderComponent(
  <MyComponent locales={["en-US"]} messages={messages["en-US"]}
    name="John" manager="Mike" />,
  document.getElementById("example")
);
// - English output: "John reports to Mike."

// Render in german:
React.renderComponent(
  <MyComponent locales={["de-DE"]} messages={messages["de-DE"]}
    name="John" manager="Mike" />,
  document.getElementById("example")
);
// - German output: "John berichtet an Mike."
```

### Example #1: Simple String Replacement with Relative Time

```javascript
var MyComponent = React.createClass({
  mixins: [ReactIntlMixin],

  render: function () {
    return <p>{this.formatMessage(this.getIntlMessage("posted"), {
      relativeTime: this.formatRelative(this.props.postDate),
    })}</p>;
  }
});

var messages = {
    "en": {
      reporting: "posted {relativeTime}"
    },

    "es": {
      reporting: "publicado {relativeTime}"
    }
};

// Render in English:
React.renderComponent(
  <MyComponent locales={["en"]} messages={messages["en"]}
    postDate="2014-05-11" />,
  document.getElementById('example')
);
// - English output: "posted 4 months ago"

// Render in Spanish:
React.renderComponent(
  <MyComponent locales={["es"]} messages={messages["es"]}
    postDate="2014-05-11" />,
  document.getElementById('example')
);
// - German output: "publicado hace 4 meses"
```

### Example #2: String Replacement with Pluralization

```javascript
var MyComponent = React.createClass({
  mixins: [ReactIntlMixin],

  render: function () {
    return <p>{this.formatMessage(this.getIntlMessage("publishers"), {
      COMPANY_COUNT: this.props.count
    })}</p>;
  }
});

var messages = {
  "en-US": {
    publishers: "{COMPANY_COUNT, plural," +
        "one {One company}" +
        "other {# companies}}" +
      " published new books."
  },

  "ru-RU": {
    publishers: "{COMPANY_COUNT, plural," +
        "one {Одна компания опубликовала}" +
        "few {# компании опубликовали}" +
        "many {# компаний опубликовали}" +
        "other {# компаний опубликовали}}" +
      " новые книги."
  }
};

// Render in English:
React.renderComponent(
  <MyComponent locales={["en-US"]} messages={messages["en-US"]} count=1 />,
  document.getElementById("example")
);
// - English output: "One company published new books."

// Render in Russian:
React.renderComponent(
  <MyComponent locales={["ru-RU"]} messgaes={messages["ru-RU"]} count=1 />,
  document.getElementById('example')
);
// - Russian output: "Одна компания опубликовала новые книги."


// If the `count` property that is passed into `MyComponent` is 2, then:
// - English output: "2 companies published new books."
// - Russian output: "2 компании опубликовали новые книги."

// if the `count` property that is passed into `MyComponent` is 99, then:
// - English output: "99 companies published new books."
// - Russian output: "99 компаний опубликовали новые книги."
```

As you can see in this example, Russian has different rules when it comes to pluralization, having different sub-messages for `one`, `few` and `other`, while American English is just targeting `one` and `other`.

### Example #3: Dates and Numbers Within Messages

In any message, you can use `{<valueName>, number [, <optionalFormat>]}` and `{<valueName>, date [, <optionalFormat>]}` to format numbers and dates, which that includes combining them with plural and gender structures as well.

```javascript
var MyComponent = React.createClass({
  mixins: [ReactIntlMixin],

  render: function () {
    return <p>
      {this.formatMessage(this.getIntlMessage('product'), this.props)}
    </p>;
  }
});

var i18n = {
  locales: ["en-US"],

  messages: {
    product: "{product} will cost {price, number, eur} if ordered by {deadline, date, timeStyle}"
  },

  formats: {
    date: {
      timeStyle: {
      hour: "numeric",
      minute: "numeric"
    },

    number: {
      EUR: {
        style: "currency",
        currency: "EUR"
      }
    }
  }
};

// Render in English:
React.renderComponent(
  <MyComponent
    locales={i18n.locales} formats={i18n.formats} messages={i18n.messages}
    product="Mac Mini" price=200 deadline=1390518044403 />,
  document.getElementById('example')
);
// - English output: "Mac Mini will cost €200 if ordered by 6:00 PM"
```

_Note: `formatMessage()` will take care of creating the internal date and number format instances, and cache them to avoid creating unnecessary objects by reusing existing instances when similar formats are applied._


Limitations
-----------

Not all browsers have implemented [ECMAScript 402][], which is the Internationalization API, for older browsers, and Safari, you might need to patch the browser by loading [Intl.js][] polyfill before including `react-intl.js` library.

License
-------

This software is free to use under the Yahoo Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.


[npm]: https://www.npmjs.org/package/react-intl
[npm-badge]: https://img.shields.io/npm/v/react-intl.svg?style=flat-square
[david]: https://david-dm.org/yahoo/react-intl
[david-badge]: https://img.shields.io/david/yahoo/react-intl.svg?style=flat-square
[Intl.js]: https://github.com/andyearnshaw/Intl.js
[ECMAScript 402]: http://www.ecma-international.org/ecma-402/1.0/
[ReactJS]: http://facebook.github.io/react/
[Mixin]: http://facebook.github.io/react/docs/reusable-components.html#mixins
[bower]: http://bower.io/
[intl-messageformat]: https://github.com/yahoo/intl-messageformat
[intl-relativeformat]: https://github.com/yahoo/intl-relativeformat
[Intl.NumberFormat]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat
[Intl.DateTimeFormat]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
[Strawman Draft]: http://wiki.ecmascript.org/doku.php?id=globalization:messageformatting
[LICENSE file]: https://github.com/yahoo/react-intl/blob/master/LICENSE.md
