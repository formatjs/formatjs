Intl MessageFormat
==================

Formats ICU Message strings with number, date, plural, and select placeholders to create localized messages.

[![npm Version][npm-badge]][npm]
[![Build Status][travis-badge]][travis]
[![Dependency Status][david-badge]][david]


![gzip size](https://img.badgesize.io/formatjs/intl-messageformat/master/dist/intl-messageformat.min.js?compression=gzip&label=core+gzip+size)

[![Sauce Test Status][sauce-badge]][sauce]

Overview
--------

### Goals

This package aims to provide a way for you to manage and format your JavaScript app's string messages into localized strings for people using your app. You can use this package in the browser and on the server via Node.js.

This implementation is based on the [Strawman proposal][strawman], but there are a few places this implementation diverges.

_Note: This `IntlMessageFormat` API may change to stay in sync with ECMA-402, but this package will follow [semver][]._

### How It Works

Messages are provided into the constructor as a `String` message, or a [pre-parsed AST][parser] object.

```js
var msg = new IntlMessageFormat(message, locales, [formats]);
```

The string `message` is parsed, then stored internally in a compiled form that is optimized for the `format()` method to produce the formatted string for displaying to the user.

```js
var output = msg.format(values);
```

### Common Usage Example

A very common example is formatting messages that have numbers with plural labels. With this package you can make sure that the string is properly formatted for a person's locale, e.g.:

```js
var MESSAGES = {
    'en-US': {
        NUM_PHOTOS: 'You have {numPhotos, plural, ' +
            '=0 {no photos.}' +
            '=1 {one photo.}' +
            'other {# photos.}}'
    },

    'es-MX': {
        NUM_PHOTOS: 'Usted {numPhotos, plural, ' +
            '=0 {no tiene fotos.}' +
            '=1 {tiene una foto.}' +
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

The message syntax that this package uses is not proprietary, in fact it's a common standard message syntax that works across programming languages and one that professional translators are familiar with. This package uses the **[ICU Message syntax][ICU]** and works for all [CLDR languages][CLDR] which have pluralization rules defined.

### Features

* Uses industry standards: [ICU Message syntax][ICU] and [CLDR locale data][CLDR].

* Supports **plural**, **select**, and **selectordinal** message arguments.

* Formats numbers and dates/times in messages using [`Intl.NumberFormat`][Intl-NF] and [`Intl.DateTimeFormat`][Intl-DTF], respectively.

* Optimized for repeated calls to an `IntlMessageFormat` instance's `format()` method.

* Supports defining custom format styles/options.

* Supports escape sequences for message syntax chars, e.g.: `"\\{foo\\}"` will output: `"{foo}"` in the formatted output instead of interpreting it as a `foo` argument.


Usage
-----

### Modern `Intl` Dependency

This package assumes that the [`Intl`][Intl] global object exists in the runtime. `Intl` is present in all modern browsers (IE11+) and Node (with full ICU). The `Intl` methods we rely on are:

1. `Intl.NumberFormat` for number formatting (can be polyfilled using [Intl.js][])
2. `Intl.DateTimeFormat` for date time formatting (can be polyfilled using [Intl.js][])
3. `Intl.PluralRules` for plural/ordinal formatting (can be polyfilled using [intl-pluralrules][])

### Loading Intl MessageFormat in a browser

```html
<script src="intl-messageformat/intl-messageformat.min.js"></script>
```

### Loading Intl MessageFormat in Node.js

Simply `require()` this package:

```js
var IntlMessageFormat = require('intl-messageformat');
```

**NOTE: Your Node has to include [full ICU](https://nodejs.org/api/intl.html)**

### Public API

#### `IntlMessageFormat` Constructor
To create a message to format, use the `IntlMessageFormat` constructor. The constructor takes three parameters:

 - **message** - _{String | AST}_ - String message (or pre-parsed AST) that serves as formatting pattern.

 - **locales** - _{String | String[]}_ - A string with a BCP 47 language tag, or an array of such strings. If you do not provide a locale, the default locale will be used. When an array of locales is provided, each item and its ancestor locales are checked and the first one with registered locale data is returned. **See: [Locale Resolution](#locale-resolution) for more details.**

 - **[formats]** - _{Object}_ - Optional object with user defined options for format styles.

```js
var msg = new IntlMessageFormat('My name is {name}.', 'en-US');
```

#### Locale Resolution

`IntlMessageFormat` uses `Intl.NumberFormat.supportedLocalesOf()` to determine which locale data to use based on the `locales` value passed to the constructor. The result of this resolution process can be determined by call the `resolvedOptions()` prototype method.

#### `resolvedOptions()` Method

This method returns an object with the options values that were resolved during instance creation. It currently only contains a `locale` property; here's an example:

```js
var msg = new IntlMessageFormat('', 'en-us');
console.log(msg.resolvedOptions().locale); // => "en-US"
```

Notice how the specified locale was the all lower-case value: `"en-us"`, but it was resolved and normalized to: `"en-US"`.

#### `format(values)` Method

Once the message is created, formatting the message is done by calling the `format()` method on the instance and passing a collection of `values`:

```js
var output = msg.format({name: "Eric"});
console.log(output); // => "My name is Eric."
```

_Note: A value **must** be supplied for every argument in the message pattern the instance was constructed with._

#### User Defined Formats

Define custom format styles is useful you need supply a set of options to the underlying formatter; e.g., outputting a number in USD:

```js
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


Examples
--------

### Plural Label

This example shows how to use the [ICU Message syntax][ICU] to define a message that has a plural label; e.g., ``"You have 10 photos"``:

```
You have {numPhotos, plural,
    =0 {no photos.}
    =1 {one photo.}
    other {# photos.}
}
```

```js
var MESSAGES = {
    photos: '...', // String from code block above.
    ...
};

var msg = new IntlMessageFormat(MESSAGES.photos, 'en-US');

console.log(msg.format({numPhotos: 0}));    // => "You have no photos."
console.log(msg.format({numPhotos: 1}));    // => "You have one photo."
console.log(msg.format({numPhotos: 1000})); // => "You have 1,000 photos."
```

_Note: how when `numPhotos` was `1000`, the number is formatted with the correct thousands separator._


License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][LICENSE] for license text and copyright information.


[npm]: https://www.npmjs.org/package/intl-messageformat
[npm-badge]: https://img.shields.io/npm/v/intl-messageformat.svg?style=flat-square
[david]: https://david-dm.org/formatjs/intl-messageformat
[david-badge]: https://img.shields.io/david/formatjs/intl-messageformat.svg?style=flat-square
[travis]: https://travis-ci.org/formatjs/intl-messageformat
[travis-badge]: https://img.shields.io/travis/formatjs/intl-messageformat/master.svg?style=flat-square
[sauce]: https://saucelabs.com/u/intl-messageformat
[sauce-badge]: https://saucelabs.com/browser-matrix/intl-messageformat.svg
[strawman]: http://wiki.ecmascript.org/doku.php?id=globalization:messageformatting
[parser]: https://github.com/formatjs/intl-messageformat-parser
[ICU]: http://userguide.icu-project.org/formatparse/messages
[CLDR]: http://cldr.unicode.org/
[Intl]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
[Intl-NF]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat
[Intl-DTF]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
[Intl-Node]: https://github.com/joyent/node/issues/6371
[Intl.js]: https://github.com/andyearnshaw/Intl.js
[rawgit]: https://rawgit.com/
[semver]: http://semver.org/
[LICENSE]: https://github.com/formatjs/intl-messageformat/blob/master/LICENSE
[intl-pluralrules]: https://github.com/eemeli/intl-pluralrules