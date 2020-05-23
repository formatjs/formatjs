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

## Requirements

If you're supporting IE11-, this requires [`Intl.getCanonicalLocales`](intl-getcanonicallocales.md).

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

## Tests

This library is [test262](https://github.com/tc39/test262/tree/master/test/intl402/Locale)-compliant.
