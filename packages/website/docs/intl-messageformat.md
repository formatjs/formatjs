---
id: intl-messageformat
title: Intl MessageFormat
---

import IntlMessageFormat from 'intl-messageformat';
global.IntlMessageFormat = IntlMessageFormat;

Formats ICU Message strings with number, date, plural, and select placeholders to create localized messages.

[![npm Version](https://img.shields.io/npm/v/intl-messageformat.svg?style=flat-square)](https://www.npmjs.org/package/intl-messageformat)
![`intl-messageformat` minzipped size](https://badgen.net/badgesize/normal/https://unpkg.com/intl-messageformat/dist/umd/intl-messageformat.min.js?label=intl-messageformat+minzipped+size)

## Overview

### Goals

This package aims to provide a way for you to manage and format your JavaScript app's string messages into localized strings for people using your app. You can use this package in the browser and on the server via Node.js.

This implementation is based on the [Strawman proposal](http://wiki.ecmascript.org/doku.php?id=globalization:messageformatting), but there are a few places this implementation diverges.

_Note: This `IntlMessageFormat` API may change to stay in sync with ECMA-402, but this package will follow [semver](http://semver.org/)._

### How It Works

Messages are provided into the constructor as a `String` message, or a [pre-parsed AST](./intl-messageformat-parser.md) object.

```tsx
const msg = new IntlMessageFormat(message, locales, [formats], [opts]);
```

The string `message` is parsed, then stored internally in a compiled form that is optimized for the `format()` method to produce the formatted string for displaying to the user.

```tsx
const output = msg.format(values);
```

### Common Usage Example

A very common example is formatting messages that have numbers with plural labels. With this package you can make sure that the string is properly formatted for a person's locale, e.g.:

```tsx live
function () {
  const enNumPhotos = new IntlMessageFormat(
    `
    You have {numPhotos, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}
    `,
    'en-US'
  );
  return enNumPhotos.format({numPhotos: 1000});
}
```

```tsx live
function () {
  const enNumPhotos = new IntlMessageFormat(
    `
    Usted {numPhotos, plural, =0 {no tiene fotos.} =1 {tiene una foto.} other {tiene # fotos.}}
    `,
    'en-US'
  );
  return enNumPhotos.format({numPhotos: 1000});
}
```

### Message Syntax

The message syntax that this package uses is not proprietary, in fact it's a common standard message syntax that works across programming languages and one that professional translators are familiar with. This package uses the **[ICU Message syntax](http://userguide.icu-project.org/formatparse/messages)** and works for all [CLDR languages](http://cldr.unicode.org/) which have pluralization rules defined.

### Features

- Uses industry standards: [ICU Message syntax](http://userguide.icu-project.org/formatparse/messages) and [CLDR locale data](http://cldr.unicode.org/).

- Supports **plural**, **select**, and **selectordinal** message arguments.

- Formats numbers and dates/times in messages using [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat) and [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat), respectively.

- Optimized for repeated calls to an `IntlMessageFormat` instance's `format()` method.

- Supports defining custom format styles/options.

- Supports escape sequences for message syntax chars, e.g.: `"'{foo}'"` will output: `"{foo}"` in the formatted output instead of interpreting it as a `foo` argument.

## Usage

### Modern `Intl` Dependency

This package assumes that the [`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) global object exists in the runtime. `Intl` is present in all modern browsers (IE11+) and Node (with full ICU). The `Intl` methods we rely on are:

1. `Intl.NumberFormat` for number formatting (can be polyfilled using [@formatjs/intl-unified-numberformat](./polyfills/intl-numberformat.md))
2. `Intl.DateTimeFormat` for date time formatting (can be polyfilled using [Intl.js](https://github.com/andyearnshaw/Intl.js/))
3. `Intl.PluralRules` for plural/ordinal formatting (can be polyfilled using [@formatjs/intl-pluralrules](./polyfills/intl-pluralrules.md))

### Loading Intl MessageFormat in a browser

```html
<script src="intl-messageformat/intl-messageformat.min.js"></script>
```

### Loading Intl MessageFormat in Node.js

Either do:

```tsx
import IntlMessageFormat from 'intl-messageformat';
```

```tsx
const IntlMessageFormat = require('intl-messageformat').default;
```

**NOTE: Your Node has to include [full ICU](https://nodejs.org/api/intl.html)**

## Public API

### `IntlMessageFormat` Constructor

To create a message to format, use the `IntlMessageFormat` constructor. The constructor takes three parameters:

- **message** - _{String | AST}_ - String message (or pre-parsed AST) that serves as formatting pattern.

- **locales** - _{String | String[]}_ - A string with a BCP 47 language tag, or an array of such strings. If you do not provide a locale, the default locale will be used. When an array of locales is provided, each item and its ancestor locales are checked and the first one with registered locale data is returned. **See: [Locale Resolution](#locale-resolution) for more details.**

- **[formats]** - _{Object}_ - Optional object with user defined options for format styles.

- **[opts]** - `{ formatters?: Formatters }`: Optional options.
  - `formatters`: Map containing memoized formatters for performance.

```tsx
const msg = new IntlMessageFormat('My name is {name}.', 'en-US');
```

### Locale Resolution

`IntlMessageFormat` uses `Intl.NumberFormat.supportedLocalesOf()` to determine which locale data to use based on the `locales` value passed to the constructor. The result of this resolution process can be determined by call the `resolvedOptions()` prototype method.

### `resolvedOptions()` Method

This method returns an object with the options values that were resolved during instance creation. It currently only contains a `locale` property; here's an example:

```tsx live
function () {
  return new IntlMessageFormat('', 'en-us').resolvedOptions().locale;
}
```

Notice how the specified locale was the all lower-case value: `"en-us"`, but it was resolved and normalized to: `"en-US"`.

### `format(values)` Method

Once the message is created, formatting the message is done by calling the `format()` method on the instance and passing a collection of `values`:

```tsx live
function () {
  return new IntlMessageFormat('My name is {name}.', 'en-US').format({name: 'Eric'});
}
```

_Note: A value **must** be supplied for every argument in the message pattern the instance was constructed with._

#### Rich Text support

```tsx live
function () {
  return new IntlMessageFormat('hello <b>world</b>', 'en').format({
    b: (...chunks) => <strong>{chunks}</strong>,
  });
}
```

We support embedded XML tag in the message, e.g `this is a <b>strong</b> tag`. This is not meant to be a full-fledged method to embed HTML, but rather to tag specific text chunk so translation can be more contextual. Therefore, the following restrictions apply:

1. Any attributes on the HTML tag are also ignored.
2. Self-closing tags are treated as string literal and not supported, please use regular ICU placeholder like `{placeholder}`.
3. All tags specified must have corresponding values and will throw
   error if it's missing, e.g:

```tsx live
function () {
  try {
    new IntlMessageFormat('a <foo>strong</foo>').format();
  } catch (e) {
    return e.message
  }
}
```

4. XML/HTML tags are escaped using apostrophe just like other ICU constructs. In order to escape you can do things like:

```tsx live
function () {
  return new IntlMessageFormat("I '<'3 cats").format();
}
```

```tsx live
function () {
  return new IntlMessageFormat("raw '<b>HTML</b>'").format();
}
```

```tsx live
function () {
  return new IntlMessageFormat(
    "raw '<b>HTML</b>' with '<a>'{placeholder}'</a>'"
  ).format({placeholder: 'some word'});
}
```

5. Embedded valid HTML tag is a bit of a grey area right now since we're not supporting the full HTML/XHTML/XML spec.

### `getAst` Method

Return the underlying AST for the compiled message.

### Date/Time/Number Skeleton

We support ICU Number skeleton and a subset of Date/Time Skeleton for further customization of formats.

#### Number Skeleton

Example:

```tsx live
function () {
  return new IntlMessageFormat(
    'The price is: {price, number, ::currency/EUR}',
    'en-GB'
  ).format({price: 100});
}
```

A full set of options and syntax can be found [here](https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md)

#### Date/Time Skeleton

ICU provides a [wide array of pattern](https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table) to customize date time format. However, not all of them are available via ECMA402's Intl API. Therefore, our parser only support the following patterns

| Symbol | Meaning                       | Notes                     |
| ------ | ----------------------------- | ------------------------- |
| G      | Era designator                |
| y      | year                          |
| M      | month in year                 |
| L      | stand-alone month in year     |
| d      | day in month                  |
| E      | day of week                   |
| e      | local day of week             | `e..eee` is not supported |
| c      | stand-alone local day of week | `c..ccc` is not supported |
| a      | AM/PM marker                  |
| h      | Hour [1-12]                   |
| H      | Hour [0-23]                   |
| K      | Hour [0-11]                   |
| k      | Hour [1-24]                   |
| m      | Minute                        |
| s      | Second                        |
| z      | Time Zone                     |

Example:

```tsx live
function () {
  return new IntlMessageFormat('Today is: {now, date, ::yyyyMMdd}', 'en-GB').format({
    now: new Date(),
  });
}
```

## Advanced Usage

### Passing in AST

You can pass in pre-parsed AST to IntlMessageFormat like this:

```ts
import IntlMessageFormat from 'intl-messageformat';
new IntlMessageFormat('hello').format(); // prints out hello

// is equivalent to

import IntlMessageFormat from 'intl-messageformat/core';
import parser from 'intl-messageformat-parser';
new IntlMessageFormat(parser.parse('hello')).format(); // prints out hello
```

This helps performance for cases like SSR or preload/precompilation-supported platforms since `AST` can be cached.

If your messages are all in ASTs, you can alias `intl-messageformat-parser` to `{default: undefined}` to save some bytes during bundling.

### Formatters

For complex messages, initializing `Intl.*` constructors can be expensive. Therefore, we allow user to pass in `formatters` to provide memoized instances of these `Intl` objects. This opts combines with [passing in AST](#passing-in-ast) and `intl-format-cache` can speed things up by 30x per the benchmark down below.

For example:

```ts
import IntlMessageFormat from 'intl-messageformat';
import memoizeIntlConstructor from 'intl-format-cache';
const formatters = {
  getNumberFormat: memoizeIntlConstructor(Intl.NumberFormat),
  getDateTimeFormat: memoizeIntlConstructor(Intl.DateTimeFormat),
  getPluralRules: memoizeIntlConstructor(Intl.PluralRules),
};
new IntlMessageFormat('hello {number, number}', 'en', undefined, {
  formatters,
}).format({number: 3}); // prints out `hello, 3`
```

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