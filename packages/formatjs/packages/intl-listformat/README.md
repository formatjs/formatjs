# Intl ListFormat

A spec-compliant polyfill/ponyfill for Intl.ListFormat fully tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version][npm-badge]][npm]
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-listformat)

## Installation

```
npm install @formatjs/intl-listformat
```

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

[npm]: https://www.npmjs.org/package/@formatjs/intl-listformat
[npm-badge]: https://img.shields.io/npm/v/@formatjs/intl-listformat.svg?style=flat-square
