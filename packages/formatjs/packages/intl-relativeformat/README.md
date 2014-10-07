Intl RelativeFormat
===================

Formats JavaScript dates to relative time strings (e.g., "3 hours ago").

[![npm Version][npm-badge]][npm]
[![Build Status][travis-badge]][travis]
[![Dependency Status][david-badge]][david]

[![Sauce Test Status][sauce-badge]][sauce]


Overview
--------

### Goals

This package aims to provide a way to format different variations of relative time. You can use this package in the browser and on the server via Node.js.

This implementation is very similar to [moment.js][], in concept, although it provides only formatting features based on the Unicode [CLDR][] locale data, an industry standard that supports more than 150 locales.

_Note: This `IntlRelativeFormat` API may change to stay in sync with ECMA-402, but this package will follow [semver][]._

### How It Works

This API is very similar to [ECMA 402][]'s [DateTimeFormat][] and [NumberFormat][].

#### `IntlRelativeFormat` Constructor

To format a date to relative time, use the `IntlRelativeFormat` constructor. The constructor takes two parameters:

 - **locales** - _{String | String[]}_ - A string with a BCP 47 language tag, or an array of such strings. If you do not provide a locale, the default locale will be used, but you should _always_ provide one!

 - **options** - _{Object}_ - Optional object with user defined options for format styles.

Here is the most basic example:

```js
var rf = new IntlRelativeFormat('en');
var output = rf.format(dateValue);
```

The format method (_which takes a JavaScript date or timestamp_) will compares it with `now`, and returns the formatted string; e.g., "3 hours ago" in the corresponding locale passed into the constructor.

_Note: The `rf` instance should be enough for your entire application, unless you want to use custom options._

### Custom Options

The optional second argument `options` provides a way to customize how the relative time will be formatted.

#### Units

By default, the relative time is computed to the best fit unit, but you can explicitly call it to force `units` to be displayed in `"second"`, `"minute"`, `"hour"`, `"day"`, `"month"` or `"year"`:

```js
var rf = new IntlRelativeFormat('en', {
    units: 'day'
});
var output = rf.format(dateValue);
```

As a result, the output will be "70 days ago" instead of "2 months ago".

#### Style

By default, the relative time is computed as `"best fit"`, which means that instead of "1 day ago", it will display "yesterday", or "in 1 year" will be "next year", etc. But you can force to always use the "numeric" alternative:

```js
var rf = new IntlRelativeFormat('en', {
    style: 'numeric'
});
var output = rf.format(dateValue);
```

As a result, the output will be "1 day ago" instead of "yesterday".


Usage
-----

### Loading IntlRelativeFormat in Node.js

Install package and polyfill:

```bash
npm install intl-relativetime --save
npm install intl --save
```

Simply `require()` this package:

```js
if (!global.Intl) {
    global.Intl = require('intl'); // polyfill for `Intl`
}
var IntlRelativeFormat = require('intl-relativeformat');
var rf = new IntlRelativeFormat('en');
var output = rf.format(dateValue);
```

_Note: in Node.js, the data for all 150+ locales is loaded along with the library._


### Loading IntlRelativeFormat in a browser

Install using bower: `bower install intl-relativetime` or [download from dist/ folder](https://github.com/yahoo/intl-relativeformat/tree/master/dist)

Include the library in your page:

```html
<script src="intl-relativeformat/intl-relativeformat.min.js"></script>
```

By default, Intl RelativeFormat ships with the locale data for English built-in to the runtime library. When you need to format data in another locale, include its data; e.g., for French:

```html
<script src="intl-relativeformat/locale-data/fr.js"></script>
```

_Note: All 150+ locales supported by this package use their root BCP 47 langage tag; i.e., the part before the first hyphen (if any)._

#### `Intl` Dependency

This package assumes that the [`Intl`][Intl] global object exists in the runtime. `Intl` is present in all modern browsers _except_ Safari, and there's work happening to [integrate `Intl` into Node.js][Intl-Node].

**Luckly, there's the [Intl.js][] polyfill!** You will need to conditionally load the polyfill if you want to support runtimes which `Intl` is not already built-in.

If the browser does not already have the `Intl` APIs built-in, the Intl.js Polyfill will need to be loaded on the page along with the locale data for any locales that need to be supported:

```html
<script src="intl/Intl.min.js"></script>
<script src="intl/locale-data/jsonp/en-US.js"></script>
```

_Note: Modern browsers already have the `Intl` APIs built-in, so you can load the Intl.js Polyfill conditionally, by for checking for `window.Intl`._


License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][LICENSE] for license text and copyright information.


[npm]: https://www.npmjs.org/package/intl-relativeformat
[npm-badge]: https://img.shields.io/npm/v/intl-relativeformat.svg?style=flat-square
[david]: https://david-dm.org/yahoo/intl-relativeformat
[david-badge]: https://img.shields.io/david/yahoo/intl-relativeformat.svg?style=flat-square
[travis]: https://travis-ci.org/yahoo/intl-relativeformat
[travis-badge]: https://img.shields.io/travis/yahoo/intl-relativeformat.svg?style=flat-square
[parser]: https://github.com/yahoo/intl-relativeformat-parser
[CLDR]: http://cldr.unicode.org/
[Intl]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
[Intl-NF]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat
[Intl-DTF]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
[Intl-Node]: https://github.com/joyent/node/issues/6371
[Intl.js]: https://github.com/andyearnshaw/Intl.js
[rawgit]: https://rawgit.com/
[semver]: http://semver.org/
[LICENSE]: https://github.com/yahoo/intl-relativeformat/blob/master/LICENSE
[moment.js]: http://momentjs.com/
[sauce]: https://saucelabs.com/u/intl-relativeformat
[sauce-badge]: https://saucelabs.com/browser-matrix/intl-relativeformat.svg
[ECMA 402]: http://www.ecma-international.org/ecma-402/1.0/index.html
[DateTimeFormat]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
[NumberFormat]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat
