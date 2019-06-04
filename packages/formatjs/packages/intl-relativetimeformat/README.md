Intl RelativeTimeFormat
===================

A spec-compliant polyfill/ponyfill for Intl.RelativeTimeFormat.

[![npm Version][npm-badge]][npm]


Installation
---
```
npm install intl-relativetimeformat
```

Requirements
---
This package requires the following capabilities:
1. [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules)
2. [Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)

**NOTE: `formatToParts` only works on Node 10+ due to lack of `Intl.NumberFormat.prototype.formatToParts` natively**

Usage
---
To use the polyfill, just import it to make sure that a fully functional Intl.RelativeTimeFormat is available in your environment:

```
import 'intl-relativetimeformat/polyfill'
```

If Intl.RelativeTimeFormat already exists, the polyfill will not be loaded.

To use this as a ponyfill:

```
import IntlRelativeTimeFormat from 'intl-relativetimeformat'
```

By default, this library comes with `en` data. To load additional locale, you can include them on demand:
```js
import 'intl-relativetimeformat/polyfill'
import 'intl-relativetimeformat/dist/locale-data/de' // Add locale data for de
```

If you want to polyfill all locales (e.g for Node):
```
import 'intl-relativetimeformat/polyfill-locales'
```

Tests
---

The majority of our tests come from [tc39/test262](https://github.com/tc39/test262/tree/master/test/intl402/RelativeTimeFormat).

License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][LICENSE] for license text and copyright information.


[npm]: https://www.npmjs.org/package/intl-relativetimeformat
[npm-badge]: https://img.shields.io/npm/v/intl-relativetimeformat.svg?style=flat-square