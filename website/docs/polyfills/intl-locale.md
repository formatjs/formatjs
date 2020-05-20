---
id: intl-locale
title: Intl.Locale
---

A spec-compliant polyfill/ponyfill for Intl.Locale tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-locale.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-locale)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-locale)

## Installation

```
npm install @formatjs/intl-locale
```

## Usage

To use the polyfill, just import it to make sure that a fully functional Intl.Locale is available in your environment:

```tsx
import '@formatjs/intl-locale/polyfill';
```

If Intl.Locale already exists, the polyfill will not be loaded.

To use this as a ponyfill:

```tsx
import IntlLocale from '@formatjs/intl-locale';
```

By default, this library does not come with `likelySubtags` data. This means there are several restrictions when it comes to canonicalizing locales. We do provide a way to load this data on demand if you need this feature.

```tsx
import '@formatjs/intl-locale/polyfill';
import * as data from 'cldr-core/supplemental/likelySubtags.json';
const PolyfilledLocale = (Intl as any).Locale as typeof Locale;
if (typeof PolyfilledLocale._addLikelySubtagData === 'function') {
  PolyfilledLocale._addLikelySubtagData(data.supplemental.likelySubtags);
}
```

If you want to polyfill with all data (e.g for Node):

```
import '@formatjs/intl-locale/polyfill-locales'
```

## Tests

This library is [test262](https://github.com/tc39/test262/tree/master/test/intl402/Locale)-compliant.
