# `intl-pluralrules`

A spec-compliant polyfill/ponyfill for [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules) fully tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version][npm-badge]][npm]
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-pluralrules)

## Installation

```
npm install @formatjs/intl-pluralrules
```

# Usage

```tsx
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/dist/locale-data/en'; // locale-data for en
```

TO polyfill w/ ALL locales:

```tsx
import '@formatjs/intl-pluralrules/polyfill-locales';
```

[npm]: https://www.npmjs.org/package/@formatjs/intl-pluralrules
[npm-badge]: https://img.shields.io/npm/v/@formatjs/intl-pluralrules.svg?style=flat-square
