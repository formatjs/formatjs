# Intl RelativeTimeFormat

A spec-compliant polyfill/ponyfill for Intl.RelativeTimeFormat fully tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version][npm-badge]][npm]
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-relativetimeformat)

## Installation

```
npm install @formatjs/intl-relativetimeformat
```

## Requirements

This package requires the following capabilities:

1. [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules)
2. [Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)

**NOTE: `formatToParts` only works on Node 10+ due to lack of `Intl.NumberFormat.prototype.formatToParts` natively**

## Usage

To use the polyfill, just import it to make sure that a fully functional Intl.RelativeTimeFormat is available in your environment:

```
import '@formatjs/intl-relativetimeformat/polyfill'
```

If Intl.RelativeTimeFormat already exists, the polyfill will not be loaded.

To use this as a ponyfill:

```
import IntlRelativeTimeFormat from '@formatjs/intl-relativetimeformat'
```

By default, this library comes with `en` data. To load additional locale, you can include them on demand:

```js
import '@formatjs/intl-relativetimeformat/polyfill';
import '@formatjs/intl-relativetimeformat/dist/locale-data/de'; // Add locale data for de
```

If you want to polyfill all locales (e.g for Node):

```
import '@formatjs/intl-relativetimeformat/polyfill-locales'
```

### Language Aliases

Language aliases are useful when we have to resolve deprecated locale (e.g `zh-CN` is technically `zh-Hans-CN`). Without aliases we would resolve `zh-CN` to `zh` which is less accurate. In order to include lang aliases, you can do:

```js
import '@formatjs/intl-relativetimeformat/polyfill';
import '@formatjs/intl-relativetimeformat/dist/include-aliases'; // Add language aliases
```

## Tests

This library is fully [test262](https://github.com/tc39/test262/tree/master/test/intl402/RelativeTimeFormat)-compliant.

## License

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][license] for license text and copyright information.

[npm]: https://www.npmjs.org/package/@formatjs/intl-relativetimeformat
[npm-badge]: https://img.shields.io/npm/v/@formatjs/intl-relativetimeformat.svg?style=flat-square
