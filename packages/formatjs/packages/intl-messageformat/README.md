Intl MessageFormat
==================

Format a string with placeholders, including plural and select support to create localized messages.

[![npm Version](https://img.shields.io/npm/v/intl-messageformat.svg?style=flat)][NPM]
[![Build Status](http://img.shields.io/travis/yahoo/intl-messageformat.svg?style=flat)][TRAVIS]
[![Dependency Status](https://img.shields.io/david/yahoo/intl-messageformat.svg?style=flat)][DAVID]

Overview
--------

### Goals

This package aims to provide a way for you to manage and format your JavaScript app's string-based messages into localized string for people using your app. You can use this package in the browser and on the server via Node.js.

This implementation is based on the [Strawman Draft][STRAWMAN]. There are a few places this implementation diverges from the strawman draft.

**Note:** This `IntlMessageFormat` API may change to stay in sync with ECMA-402.

### How It Works

Messages are provided into the constructor as `String` message, or [pre-parsed AST][PARSER].

```javascript
var msg = new IntlMessageFormat(message, locales, [formats]);
```

The string `message` is parsed, then stored internally in a compiled form that is optomized for generating the formatted string via the `format()` method.

```javascript
var output = msg.format(values);
```

### Common Usage Example

A very common example is formatting messages that have numbers with plural lables. With this package you can make sure that the string is properly formatted for a person's locale, e.g.:

```javascript
var MESSAGES = {
    'en-US': {
        NUM_PHOTOS: 'You have {numPhotos, plural, ' +
            '0= {no photos.}' +
            '1= {one photo.}' +
            'other {# photos.}}'
    },

    'es-MX': {
        NUM_PHOTOS: 'Usted {numPhotos, plural, ' +
            '0= {no tiene fotos.}' +
            '1= {tiene una foto.}' +
            'other {tiene # fotos.}}'
    }
};

var output;

var enNumPhotos = new IntlMessageFormat(MESSAGES['en-US'].NUM_PHOTOS, 'en-US');
output = enNumPhotos.format({numPhotos: 1000});
console.log(output); // => "You have 1,000 photos."

var esNumPhotos = new IntlMessageFormat(MESSAGES['es-MX'].NUM_PHOTOS, 'es-MX');
output = esNumPhotos.format({numPhotos: 1000});
console.log(output); // => "Usted tiene 1,000 fotos."
```

### Message Syntax

The message syntax that this package uses is not proprietary, in fact it's a common standard message syntax that works across programming languages and one that professional translators are familiar with. This package uses the **[ICU Message syntax][ICU]** and works for all [CLDR languages][CLDR].

### Features

* Follows [ICU Message][ICU] and [CLDR][CLDR] standards.

* Supports **plural** and **select** message arguments.

* Formats numbers and dates/times in messages using [`Intl.NumberFormat`][INTL-NF] and [`Intl.DateTimeFormat`][INTL-DTF], respectively.

* Optimized for repeated calls to an `IntlMessageFormat` instance's `format()` method.

* Supports defining custom format styles/options.

* Supports escape sequences for message syntax chars, e.g.: `"\\{foo\\}"` will output: `"{foo}"` in the formatted output instead of interpreting it as a `foo` argument.


Usage
-----

### `Intl` Dependency

This package assumes that the [`Intl`][INTL] global object exists in the runtime. `Intl` is present in all modern browsers _except_ Safari, and there's work happening to [integrate `Intl` into Node.js][NODE-INTL].

**Luckly, there's the [Intl.js][] polyfill!** You will need to conditionally load the polyfill if you want to support runtimes which `Intl` is not already built-in.

### Public API

#### `IntlMessageFormat` Constructor
To create a message to format, use the IntlMessageFormat constructor. The constructor has three parameters:

 - **message** - _{String | AST}_ - String message (or pre-parsed AST) that serves as formatting pattern.

 - **locales** - _{String | String[]}_ - A string with a BCP 47 language tag, or an array of such strings. If you do not provide a locale, the default locale will be used, but you should _always_ provide one!

 - **[formats]** - _{Object}_ - Optional object with user defined options for format styles.

##### Creating a Message in Node.js
```javascript
// Conditionally load the Intl.js polyfill.
global.Intl || require('intl');

var IntlMessageFormat = require('intl-messageformat');

var msg = new IntlMessageFormat('My name is {name}.', 'en-US');
```

##### Creating a Message in a Browser
```html
<script src="https://cdn.rawgit.com/yahoo/intl-messageformat/v1.0.0-rc-1/dist/intl-messageformat.min.js"></script>
<script>
    var msg = new IntlMessageFormat('My name is {name}.', 'en-US');
</script>
```

#### `format(values)` Method

Once the message is created, formatting the message is done by calling the `format()` method on the instance and passing a collection of `values`:

```javascript
var output = msg.format({name: "Eric"});
console.log(output); // => "My name is Eric."
```

**Note:** A value _must_ be supplied for every argument in the message pattern the instance was constructed with.

#### User Defined Formats

Define custom format styles is useful you need supply a set of options to the underlying formatter; e.g., outputting a number in USD:

```javascript
var msg = new IntlMessageFormat('The price is: {price, number, USD}', 'en-US', {
    number: {
        USD: {
            style   : 'currency',
            currency: 'USD'
        }
    }
});

var output = msg.format({price: 100});
console.log(output); // => "The price is: $100.00"
```

In this example, we're defining a `USD` number format style which is passed to the underlying `Intl.NumberFormat` instance as its options.


License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][LICENSE] for license text and copyright information.


[DAVID]: https://david-dm.org/yahoo/intl-messageformat
[TRAVIS]: https://travis-ci.org/yahoo/intl-messageformat
[NPM]: https://www.npmjs.org/package/intl-messageformat
[STRAWMAN]: http://wiki.ecmascript.org/doku.php?id=globalization:messageformatting
[PARSER]: https://github.com/yahoo/intl-messageformat-parser
[ICU]: http://userguide.icu-project.org/formatparse/messages
[CLDR]: http://cldr.unicode.org/
[INTL]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
[INTL-NF]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat
[INTL-DTF]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
[NODE-INTL]: https://github.com/joyent/node/issues/6371
[Intl.js]: https://github.com/andyearnshaw/Intl.js
[LICENSE]: https://github.com/yahoo/intl-messageformat/blob/master/LICENSE
