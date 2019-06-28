# Intl MessageFormat

Formats ICU Message strings with number, date, plural, and select placeholders to create localized messages.

[![npm Version][npm-badge]][npm]

| Package                   | Minzipped Size |
| ------------------------- | -------------- |
| `intl-messageformat`      | `5.14kB`       |
| `intl-messageformat/core` | `2.19kB`       |

## Overview

### Goals

This package aims to provide a way for you to manage and format your JavaScript app's string messages into localized strings for people using your app. You can use this package in the browser and on the server via Node.js.

This implementation is based on the [Strawman proposal][strawman], but there are a few places this implementation diverges.

_Note: This `IntlMessageFormat` API may change to stay in sync with ECMA-402, but this package will follow [semver][]._

### How It Works

Messages are provided into the constructor as a `String` message, or a [pre-parsed AST][parser] object.

```js
var msg = new IntlMessageFormat(message, locales, [formats], [opts]);
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
    NUM_PHOTOS:
      'You have {numPhotos, plural, ' +
      '=0 {no photos.}' +
      '=1 {one photo.}' +
      'other {# photos.}}'
  },

  'es-MX': {
    NUM_PHOTOS:
      'Usted {numPhotos, plural, ' +
      '=0 {no tiene fotos.}' +
      '=1 {tiene una foto.}' +
      'other {tiene # fotos.}}'
  }
};

var output;

var enNumPhotos = new IntlMessageFormat(MESSAGES['en-US'].NUM_PHOTOS, 'en-US');
output = enNumPhotos.format({ numPhotos: 1000 });
console.log(output); // => "You have 1,000 photos."

var esNumPhotos = new IntlMessageFormat(MESSAGES['es-MX'].NUM_PHOTOS, 'es-MX');
output = esNumPhotos.format({ numPhotos: 1000 });
console.log(output); // => "Usted tiene 1,000 fotos."
```

### Message Syntax

The message syntax that this package uses is not proprietary, in fact it's a common standard message syntax that works across programming languages and one that professional translators are familiar with. This package uses the **[ICU Message syntax][icu]** and works for all [CLDR languages][cldr] which have pluralization rules defined.

### Features

- Uses industry standards: [ICU Message syntax][icu] and [CLDR locale data][cldr].

- Supports **plural**, **select**, and **selectordinal** message arguments.

- Formats numbers and dates/times in messages using [`Intl.NumberFormat`][intl-nf] and [`Intl.DateTimeFormat`][intl-dtf], respectively.

- Optimized for repeated calls to an `IntlMessageFormat` instance's `format()` method.

- Supports defining custom format styles/options.

- Supports escape sequences for message syntax chars, e.g.: `"\\{foo\\}"` will output: `"{foo}"` in the formatted output instead of interpreting it as a `foo` argument.

## Usage

### Modern `Intl` Dependency

This package assumes that the [`Intl`][intl] global object exists in the runtime. `Intl` is present in all modern browsers (IE11+) and Node (with full ICU). The `Intl` methods we rely on are:

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

- **[opts]** - `{ formatters?: Formatters }`: Optional options.
  - `formatters`: Map containing memoized formatters for performance.

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
var output = msg.format({ name: 'Eric' });
console.log(output); // => "My name is Eric."
```

_Note: A value **must** be supplied for every argument in the message pattern the instance was constructed with._

#### `getAst` Method

Return the underlying AST for the compiled message

#### User Defined Formats

Define custom format styles is useful you need supply a set of options to the underlying formatter; e.g., outputting a number in USD:

```js
var msg = new IntlMessageFormat('The price is: {price, number, USD}', 'en-US', {
  number: {
    USD: {
      style: 'currency',
      currency: 'USD'
    }
  }
});

var output = msg.format({ price: 100 });
console.log(output); // => "The price is: $100.00"
```

In this example, we're defining a `USD` number format style which is passed to the underlying `Intl.NumberFormat` instance as its options.

## Advanced Usage

### Core entry point

We also expose another entry point via `intl-messageformat/core` that does not contain the parser from `intl-messageformat-parser`. This is significantly smaller than the regular package but expects the message passed in to be in `AST` form instead of string. E.g:

```ts
import IntlMessageFormat from 'intl-messageformat';
new IntlMessageFormat('hello').format(); // prints out hello

// is equivalent to

import IntlMessageFormat from 'intl-messageformat/core';
import parser from 'intl-messageformat-parser';
new IntlMessageFormat(parser.parse('hello')).format(); // prints out hello
```

This helps performance for cases like SSR or preload/precompilation-supported platforms since `AST` can be cached.

### Formatters

For complex messages, initializing `Intl.*` constructors can be expensive. Therefore, we allow user to pass in `formatters` to provide memoized instances of these `Intl` objects. This opts combines with passing in AST + using [core entry point](#core-entry-point) and `intl-format-cache` can speed things up by 30x per the benchmark down below.

For example:

```ts
import IntlMessageFormat from 'intl-messageformat';
import memoizeIntlConstructor from 'intl-format-cache';
const formatters = {
  getNumberFormat: memoizeIntlConstructor(Intl.NumberFormat),
  getDateTimeFormat: memoizeIntlConstructor(Intl.DateTimeFormat),
  getPluralRules: memoizeIntlConstructor(Intl.PluralRules)
};
new IntlMessageFormat('hello {number, number}', 'en', undefined, {
  formatters
}).format({ number: 3 }); // prints out `hello, 3`
```

## Examples

### Plural Label

This example shows how to use the [ICU Message syntax][icu] to define a message that has a plural label; e.g., `"You have 10 photos"`:

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

## Benchmark

```
format_cached_complex_msg x 539,674 ops/sec ±1.87% (87 runs sampled)
format_cached_string_msg x 99,311,640 ops/sec ±2.15% (87 runs sampled)
new_complex_msg_preparsed x 1,490 ops/sec ±8.37% (54 runs sampled)
new_complex_msg x 836 ops/sec ±31.96% (67 runs sampled)
new_string_msg x 27,752 ops/sec ±8.25% (65 runs sampled)
complex msg format x 799 ops/sec ±9.38% (55 runs sampled)
complex msg w/ formatters format x 1,878 ops/sec ±16.63% (64 runs sampled)
complex preparsed msg w/ formatters format x 26,482 ops/sec ±2.55% (84 runs sampled)
```

## License

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][license] for license text and copyright information.

[npm]: https://www.npmjs.org/package/intl-messageformat
[npm-badge]: https://img.shields.io/npm/v/intl-messageformat.svg?style=flat-square
[strawman]: http://wiki.ecmascript.org/doku.php?id=globalization:messageformatting
[parser]: https://github.com/formatjs/formatjs/blob/master/packages/intl-messageformat-parser
[icu]: http://userguide.icu-project.org/formatparse/messages
[cldr]: http://cldr.unicode.org/
[intl]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
[intl-nf]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat
[intl-dtf]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
[intl-node]: https://github.com/joyent/node/issues/6371
[intl.js]: https://github.com/andyearnshaw/Intl.js
[rawgit]: https://rawgit.com/
[semver]: http://semver.org/
[license]: https://github.com/formatjs/formatjs/blob/master/LICENSE
[intl-pluralrules]: https://github.com/eemeli/intl-pluralrules
