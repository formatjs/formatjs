---
id: intl-datetimeformat
title: Intl.DateTimeFormat
---

A spec-compliant polyfill for Intl.DateTimeFormat fully tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-datetimeformat.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-datetimeformat)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-datetimeformat)

## Installation

```
npm install @formatjs/intl-datetimeformat
```

## Requirements

This package requires the following capabilities:

1. If you're supporting IE11-, this requires [`Intl.getCanonicalLocales`](intl-getcanonicallocales.md).

2. [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat)

## Usage

### Polyfill

To use the polyfill, just import it to make sure that a fully functional Intl.DateTimeFormat is available in your environment:

```tsx
import '@formatjs/intl-datetimeformat/polyfill'
import '@formatjs/intl-datetimeformat/locale-data/de' // Add locale data for de
```

### Adding IANA Timezone Database

We provide 2 pre-processed IANA Timezone:

#### Full: contains ALL Timezone from IANA database

```tsx
import '@formatjs/intl-datetimeformat/polyfill'
import '@formatjs/intl-datetimeformat/add-all-tz.js'
```

#### Golden: contains popular set of timezones from IANA database

```tsx
import '@formatjs/intl-datetimeformat/polyfill'
import '@formatjs/intl-datetimeformat/add-golden-tz.js'
```

## Tests

This library is fully [test262](https://github.com/tc39/test262/tree/master/test/intl402/DateTimeFormat)-compliant.
