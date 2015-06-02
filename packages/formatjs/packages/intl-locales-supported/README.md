intl-locales-supported
======================

Utility to help you polyfill the Node.js runtime when the [`Intl`][Intl] APIs are missing, or if the built-in `Intl` is missing locale data that you need.

[![npm Version][npm-badge]][npm]
[![Build Status][travis-badge]][travis]
[![Dependency Status][david-badge]][david]


## Usage

```js
var areIntlLocalesSupported = require('intl-locales-supported');

var localesMyAppSupports = [
    /* list locales here */
];

if (global.Intl) {
    // Determine if the built-in `Intl` has the locale data we need.
    if (!areIntlLocalesSupported(localesMyAppSupports)) {
        // `Intl` exists, but it doesn't have the data we need, so load the
        // polyfill and replace the constructors we need with the polyfill's.
        require('intl');
        Intl.NumberFormat   = IntlPolyfill.NumberFormat;
        Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;
    }
} else {
    // No `Intl`, so use and load the polyfill.
    global.Intl = require('intl');
}
```

For more details, see the [FormatJS guide on polyfillying `Intl` in Node.js](http://formatjs.io/guides/runtime-environments/#polyfill-node).

## License

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][LICENSE] for license text and copyright information.


[npm]: https://www.npmjs.org/package/intl-locales-supported
[npm-badge]: https://img.shields.io/npm/v/intl-locales-supported.svg?style=flat-square
[travis]: https://travis-ci.org/yahoo/intl-locales-supported
[travis-badge]: https://img.shields.io/travis/yahoo/intl-locales-supported.svg?style=flat-square
[david]: https://david-dm.org/yahoo/intl-locales-supported
[david-badge]: https://img.shields.io/david/yahoo/intl-locales-supported.svg?style=flat-square
[Intl]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
[FormatJS]: http://formatjs.io/
[LICENSE]: https://github.com/yahoo/intl-locales-supported/blob/master/LICENSE
