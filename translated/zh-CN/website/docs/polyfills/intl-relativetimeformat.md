---
id: intl-relativetimeformat
title: Intl.RelativeTimeFormat
---

A spec-compliant polyfill for Intl.RelativeTimeFormat fully tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-relativetimeformat.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-relativetimeformat) ![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-relativetimeformat)

## Installation

```
npm install @formatjs/intl-relativetimeformat
```

## Requirements

This package requires the following capabilities:

1. [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules)

2. If you're supporting IE11-, this requires [`Intl.getCanonicalLocales`](intl-getcanonicallocales.md).

3. If you need `formatToParts` and have to support IE11- or Node 10-, you'd need to polyfill using [`@formatjs/intl-numberformat`](intl-numberformat.md).

## Usage

To use the polyfill, just import it to make sure that a fully functional Intl.RelativeTimeFormat is available in your environment:

```tsx
import '@formatjs/intl-relativetimeformat/polyfill';
import '@formatjs/intl-relativetimeformat/locale-data/de'; // Add locale data for de
```

If you want to polyfill all locales (e.g for Node):

```tsx
import '@formatjs/intl-relativetimeformat/polyfill-locales';
```

## Tests

This library is fully [test262](https://github.com/tc39/test262/tree/master/test/intl402/RelativeTimeFormat)-compliant.
