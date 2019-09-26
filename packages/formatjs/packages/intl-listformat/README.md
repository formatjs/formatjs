# Intl ListFormat

A spec-compliant polyfill/ponyfill for Intl.ListFormat fully tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version][npm-badge]][npm]
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-listformat)

## Installation

```
npm install @formatjs/intl-listformat
```

## Requirements

This package requires the following capabilities:

1. [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules)
2. [Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)

**NOTE: `formatToParts` only works on Node 10+ due to lack of `Intl.NumberFormat.prototype.formatToParts` natively**

## Usage

To use the polyfill, just import it to make sure that a fully functional Intl.ListFormat is available in your environment:

```
import '@formatjs/intl-listformat/polyfill'
```

If Intl.ListFormat already exists, the polyfill will not be loaded.

To use this as a ponyfill:

```
import IntlListFormat from '@formatjs/intl-listformat'
```

By default, this library comes with `en` data. To load additional locale, you can include them on demand:

```js
import '@formatjs/intl-listformat/polyfill';
import '@formatjs/intl-listformat/dist/locale-data/de'; // Add locale data for de
```

If you want to polyfill all locales (e.g for Node):

```
import '@formatjs/intl-listformat/polyfill-locales'
```

## Tests

This library is fully [test262](https://github.com/tc39/test262/tree/master/test/intl402/ListFormat)-compliant.

## License

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][license] for license text and copyright information.

[npm]: https://www.npmjs.org/package/@formatjs/intl-listformat
[npm-badge]: https://img.shields.io/npm/v/@formatjs/intl-listformat.svg?style=flat-square
