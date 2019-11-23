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

**NOTE: `formatToParts` only works on Node 10+ due to lack of `Intl.NumberFormat.prototype.formatToParts` natively**

## Usage

### Ponyfill

To use the ponyfill, import it along with its data:

```tsx
import IntlRelativeTimeFormat from '@formatjs/intl-relativetimeformat';
// locale-data for zh
IntlRelativeTimeFormat.__addLocaleData(
  require('@formatjs/intl-relativetimeformat/dist/locale-data/zh.json')
);

// locale-data for zh
IntlRelativeTimeFormat.__addLocaleData(
  require('@formatjs/intl-relativetimeformat/dist/locale-data/en.json')
);

new IntlRelativeTimeFormat('zh-CN').format(-1, 'second'); // '1秒钟前'
```

### Polyfill

To use the polyfill, just import it to make sure that a fully functional Intl.RelativeTimeFormat is available in your environment:

```tsx
import '@formatjs/intl-relativetimeformat/polyfill';
import '@formatjs/intl-relativetimeformat/dist/locale-data/de'; // Add locale data for de
```

If you want to polyfill all locales (e.g for Node):

```tsx
import '@formatjs/intl-relativetimeformat/polyfill-locales';
```

## Tests

This library is fully [test262](https://github.com/tc39/test262/tree/master/test/intl402/RelativeTimeFormat)-compliant.

[npm]: https://www.npmjs.org/package/@formatjs/intl-relativetimeformat
[npm-badge]: https://img.shields.io/npm/v/@formatjs/intl-relativetimeformat.svg?style=flat-square
