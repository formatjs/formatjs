---
id: intl-getcanonicallocales
title: Intl.getCanonicalLocales
---

A spec-compliant polyfill/ponyfill for `Intl.getCanonicalLocales` tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-getcanonicallocales.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-getcanonicallocales) ![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-getcanonicallocales)

## Installation

```
npm install @formatjs/intl-getcanonicallocales
```

## Usage

To use the polyfill, just import it to make sure that a fully functional Intl.Locale is available in your environment:

```tsx
import '@formatjs/intl-getcanonicallocales/polyfill'
```

If Intl.Locale already exists, the polyfill will not be loaded.

To use this as a ponyfill:

```tsx
import getCanonicalLocales from '@formatjs/intl-getcanonicallocales'
```

## Tests

This library is [test262](https://github.com/tc39/test262/tree/master/test/intl402/Intl/getCanonicalLocales)-compliant.
