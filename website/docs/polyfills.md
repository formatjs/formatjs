---
id: polyfills
title: Polyfills
---

One of our goals is to provide developers with access to newest ECMA-402 Intl APIs. Therefore, FormatJS suite also provide multiple high quality polyfills that are fully tested using the [Official ECMAScript Conformance Test Suite](https://github.com/tc39/test262).

Our current list of polyfills includes:

- [Intl.PluralRules](polyfills/intl-pluralrules.md)
- [Intl.RelativeTimeFormat](polyfills/intl-relativetimeformat.md)
- [Intl.ListFormat](polyfills/intl-listformat.md)
- [Intl.DisplayNames](polyfills/intl-displaynames.md)
- [Intl.NumberFormat](polyfills/intl-numberformat.md) (ES2020)
- [Intl.Locale](polyfills/intl-locale.md)
- [Intl.LocaleMatcher](polyfills/intl-localematcher.md)
- [Intl.getCanonicalLocales](polyfills/intl-getcanonicallocales.md)
- [Intl.DateTimeFormat](polyfills/intl-datetimeformat.md) (ES2020)
- [Intl.Segmenter](polyfills/intl-segmenter.md)

![Polyfill Hierarchy](/img/polyfills.svg)

# polyfill.io Integration

For basic use cases, we recommend using [polyfill.io](https://polyfill.io/) or [polyfill-library](https://github.com/Financial-Times/polyfill-library) to generate polyfill bundle since it automatically resolves the dependencies above for you.
