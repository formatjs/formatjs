React Intl Mixin
================

This repository contains a [ReactJS][] Component Mixin to implement Internationalization
features in a React component. The Intl Mixin provides a series of methods that
can be used in the `render()` method of the component to provide date formatting,
number formatting, as well as plural and gender based translations.

## Overview

The `ReactIntlMixin` implements a [ReactJS][] Component [Mixin][] that adds these new methods to any React component:

 * `intlDate()` to format a date value
 * `intlNumber()` to format a numeric value
 * `intlMessage()` to format a complex message

`intlDate()` and `intlNumber()` are just sugar on top of [Intl.NumberFormat][] and [Intl.DateTimeFormat][], APIs implemented by most modern browsers. On top of them, React Intl Mixin uses an internal caching mechanism to reuse instances of `Intl.NumberFormat` and `Intl.DateTimeFormat` when possible to avoid the performance penalty of creating these objects over and over again.

Similarly, `intlMessage()` is a sugar layer on top of [intl-messageformat][], a library to support more advanced translation patterns that include complex pluralization and gender support. This library is based on the [Strawman Draft][] that is set to evolve [ECMAScript 402][] to provide a standardized way to concatenate strings with localization support in JavaScript.

In general, `intlMessage()` provides different ways to translate content in the `render()` method of your React components. It also provides the right hooks for your application to implement i18n in an effective way, including the ability to cache expensive objects created through `new IntlMessageFormat(pattern, locale, [optFieldFormatters])`.

The data consumed by `intlMessage()` follows the same format supported by [intl-messageformat][], which is one of the industry standards used in other programming languages like Java and PHP. Although this format looks complex, professional translators are familiar with it. You can learn more about this format here: https://github.com/yahoo/intl-messageformat#how-it-works.

## Installation

### Browser

1. Install with [bower][]: `bower install react-intl`.
2. Load the scripts into your page.

```html
<script src="path/to/react.js"></script>
<script src="path/to/react-intl.js"></script>
```

_Note: for older browsers and Safari you may need to also load the [Intl.js][] polyfill before including `react-intl.js`._

3. Creating a React component with the Intl Mixin:

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

4. Using the React component by specifying `locales`:

```javascript
React.renderComponent(
  <MyComponent locales={["fr-FR"]}/>,
  document.getElementById('example')
);
```

### Node/CommonJS

1. You can install the mixin with npm: `npm install react-intl`.
2. Load in the module and register it.

```javascript
var ReactIntlMixin = require('react-intl');
```

## Advanced Options

### Date and Time formatters

#### Explicit formats

By default, when using `{this.intlDate(new Date())}` and `{this.intlNumber(600)}`, `react-intl` will use the default format for the data, and the default numeric format for the number. To specify a custom format you can pass in a second argument with the format you want to use. The following examples will ilustrate this option:

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

This explicit way to specify a format works well for simple cases, but for complex applications, it falls short because you will have to pass these values everywhere. Also, it doesn't work with complex structures processed by `intlMessage()` because there is no way to pass the formatter for each individual element. To overcome this limitation, we introduced the concept of "custom formatters".


#### Custom formatters

With custom formatters, you can specify a set of rules that can be applied to your entire application or to a section of the page (a component and its child components). These custom formatters can also be used thru `intlMessage()` API for complex language sentences. The following examples will ilustrate how custom formatters work.

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

In the example above, if `locales` is set to `["en-US"]`, the output will be:

```html
A: 6:00 PM
B: 40,000%
C: Mac Mini will cost €200 if ordered by 6:00 PM
```

By defining `this.props.formats`, which specifies a set of named formats under `date` and `number` members, you can use those named formats as a second argument for `intlNumber()` and `intlDate()`. You can also reference them as a third token when defining the messages, e.g: `{deadline, date, timeStyle}`. In this case `deadline` describes the format options for its value, specifying that it is a `date` and should be formatted using the `timeStyle` custom formatter.

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

Then make sure `MyRootComponent` uses the `ReactIntlMixin`. By doing that, you can define the list of `locales`, normally one or more in case you want to support fallback, (e.g.: `["fr-FR", "en"]`); and you can define `formats` to describe how the application will format dates and numbers. All child components will be able to inherit these two structures in such a way that you don't have to propagate or define `locales` or `formats` at each level in your application. Just apply this mixin in those components that are suppose to use `this.intlNumber()`, `this.intlDate()` and/or `this.intlMessage()` in the `render()` method and you're all set.


## How to use intlMessage()


### Example #1: simple string replacement

```javascript
var MyComponent = React.createClass({
  mixins: [ReactIntlMixin],
  render: function () {
    return <p>{this.intlMessage(GlobalMessages.MSG1, {
      employee: this.props.name,
      manager: this.props.manager
    })}</p>;
  }
});

// render in English:
GlobalMessages = {
    MSG1: "{employee} reports to {manager}."
};
React.renderComponent(
  <MyComponent locales={["en-US"]} name="John" manager="Mike" />,
  document.getElementById('example')
);
// - English output: "John reports to Mike."


// render in german:
GlobalMessages = {
    MSG1: "{EMPLOYEE} berichtet an {MANAGER}."
};
React.renderComponent(
  <MyComponent locales={["de-DE"]} name="John" manager="Mike" />,
  document.getElementById('example')
);
// - german output: "John berichtet an Mike."
```

### Example #2: string replacement with pluralization

```javascript
var MyComponent = React.createClass({
  mixins: [ReactIntlMixin],
  render: function () {
    return <p>{this.intlMessage(GlobalMessages.OTHER, {
      COMPANY_COUNT: this.props.count
    })}</p>;
  }
});

// render in English:
GlobalMessages = {
  OTHER: "{COMPANY_COUNT, plural, one {One company} other {# companies}} published new books."
};
React.renderComponent(
  <MyComponent locales={["en-US"]} count=1 />,
  document.getElementById('example')
);
// - English output: "One company published new books."


// render in Russian:
GlobalMessages = {
  OTHER: "{COMPANY_COUNT, plural, one {Одна компания опубликовала} few {# компании опубликовали} many {# компаний опубликовали} other {# компаний опубликовали}} новые книги."
};
React.renderComponent(
  <MyComponent locales={["ru-RU"]} count=1 />,
  document.getElementById('example')
);
// - Russian output: "Одна компания опубликовала новые книги."


// if the `count` property that is passed into `MyComponent` is 2, then:
// - English output: "2 companies published new books."
// - Russian output: "2 компании опубликовали новые книги."

// if the `count` property that is passed into `MyComponent` is 99, then:
// - English output: "99 companies published new books."
// - Russian output: "99 компаний опубликовали новые книги."
```

As you can see in this example, Russian has different rules when it comes to pluralization, having different messages for `one`, `few` and `other`, while American English is just targeting `one` and `other`.


### Example #3: string replacement with pluralization and gender

```javascript
var MyComponent = React.createClass({
  mixins: [ReactIntlMixin],
  render: function () {
    return <p>{this.intlMessage(GlobalMessages.ANOTHER, this.props)}</p>;
  }
});

// render in French:
GlobalMessages = {
  ANOTHER: "{TRAVELLER_COUNT} {TRAVELLER_COUNT, plural, one {est {GENDER, select, female {allée} other {allé}}} other {sont {GENDER, select, female {allées} other {allés}}}} à {CITY}."
};
React.renderComponent(
  <MyComponent locales={["fr-FR"]} TRAVELLER_COUNT=1 GENDER="female" />,
  document.getElementById('example')
);
// - French output: "1 est allée à Havana"


// render in English
GlobalMessages = {
  ANOTHER: "{TRAVELLER_COUNT} went to {CITY}."
};
React.renderComponent(
  <MyComponent locales={["en-US"]} TRAVELLER_COUNT=1 GENDER="female" />,
  document.getElementById('example')
);
// - English output: "1 went to Havana"


// render in French:
GlobalMessages = {
  ANOTHER: "{TRAVELLER_COUNT} {TRAVELLER_COUNT, plural, one {est {GENDER, select, female {allée} other {allé}}} other {sont {GENDER, select, female {allées} other {allés}}}} à {CITY}."
};
React.renderComponent(
  <MyComponent locales={["fr-FR"]} TRAVELLER_COUNT=3 />,
  document.getElementById('example')
);
// - French output: "3 sont allés à Havana"


// render in English
GlobalMessages = {
  ANOTHER: "{TRAVELLER_COUNT} went to {CITY}."
};
React.renderComponent(
  <MyComponent locales={["en-US"]} TRAVELLER_COUNT=3 />,
  document.getElementById('example')
);
// - English output: "3 went to Havana"
```

The example above is more generic, and we pass all props as data into the `intlMessage()` method instead of picking up individual `props` that we need per translation. This is a common practive for small components.

You can also see how the French version of `GlobalMessages.ANOTHER` is combining the use of pluralization (for `TRAVELLER_COUNT`) and the gender of the traveler or travelers because it is derived from Latin, in which case the gender might change the structure of the sentence, while in American English this is not affecting the output of the translation.


### Example #4: dates and numbers within messages

In any message, you can use `{<valueName>, number[, <optionalFormat>]}` and `{<valueName>, date[, <optionalFormat>]}` to format numbers and dates, and that includes combining them with plural and gender structures as well.

```javascript
var MyComponent = React.createClass({
  mixins: [ReactIntlMixin],
  render: function () {
    return <p>{this.intlMessage(GlobalMessages.COMBINE, this.props)}</p>;
  }
});

// render in English:
GlobalMessages = {
  COMBINE: "{product} will cost {price, number, eur} if ordered by {deadline, date, timeStyle}"
};
GlobalLocales = ["en-US"];
GlobalFormats = {
  "date": {
    "timeStyle": {
    "hour": "numeric",
    "minute": "numeric"
  }
  "number": {
    "eur": {
      "style": "currency",
      "currency": "EUR"
    }
  }
};
React.renderComponent(
  <MyComponent locales={GlobalLocales} formats={GlobalFormats} product="Mac Mini" price=200 deadline=1390518044403 />,
  document.getElementById('example')
);
// - English output: "Mac Mini will cost €200 if ordered by 6:00 PM"
```

_Note: `IntlMessage()` will take care of caching internal structures for date and numbers to avoid creating unnecessary objects by reusing existing instances when similar formats are applied._

Limitations
-----------

Not all browsers have implemented [ECMAScript 402][], which is the internationalization API, for older browsers, and Safari, you might need to patch the browser by loading [Intl.js][] polyfill before including `react-intl.js` library.

License
-------

This software is free to use under the Yahoo Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.

[Intl.js]: https://github.com/andyearnshaw/Intl.js
[ECMAScript 402]: http://www.ecma-international.org/ecma-402/1.0/
[ReactJS]: http://facebook.github.io/react/
[Mixin]: http://facebook.github.io/react/docs/reusable-components.html#mixins
[bower]: http://bower.io/
[intl-messageformat]: https://github.com/yahoo/intl-messageformat
[Intl.NumberFormat]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat
[Intl.DateTimeFormat]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
[Strawman Draft]: http://wiki.ecmascript.org/doku.php?id=globalization:messageformatting
[LICENSE file]: https://github.com/caridy/react-intl/blob/master/LICENSE.md
