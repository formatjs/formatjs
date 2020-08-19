---
id: intl-datetimeformat
title: Intl.DateTimeFormat
---

A spec-compliant polyfill for Intl.DateTimeFormat fully tested by the [official ECMAScript Conformance test suite](https://github.com/tc39/test262)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-datetimeformat.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-datetimeformat) ![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-datetimeformat)

## Installation

```
npm install @formatjs/intl-datetimeformat
```

## Requirements

This package requires the following capabilities:

1. If you're supporting IE11-, this requires [`Intl.getCanonicalLocales`](intl-getcanonicallocales.md).

2. [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat)

## Usage

### Simple

```tsx
import '@formatjs/intl-datetimeformat/polyfill'
import '@formatjs/intl-datetimeformat/locale-data/en' // locale-data for en
import '@formatjs/intl-datetimeformat/add-all-tz' // Add ALL tz data
```

### Dynamic import + capability detection

```tsx
import {shouldPolyfill} from '@formatjs/intl-datetimeformat/should-polyfill'
async function polyfill(locale: string) {
  if (shouldPolyfill()) {
    // Load the polyfill 1st BEFORE loading data
    await import('@formatjs/intl-datetimeformat/polyfill')
  }

  if (Intl.DateTimeFormat.polyfilled) {
    // Parallelize CLDR data loading
    const dataPolyfills = [import('@formatjs/intl-datetimeformat/add-all-tz')]

    switch (locale) {
      default:
        dataPolyfills.push(
          import('@formatjs/intl-datetimeformat/locale-data/en')
        )
        break
      case 'fr':
        dataPolyfills.push(
          import('@formatjs/intl-datetimeformat/locale-data/fr')
        )
        break
    }
    await Promise.all(polyfills)
  }
}
```

### Adding IANA Timezone Database

We provide 2 pre-processed IANA Timezone:

#### Full: contains ALL Timezone from IANA database

```tsx
import '@formatjs/intl-datetimeformat/polyfill'
import '@formatjs/intl-datetimeformat/add-all-tz'
```

#### Golden: contains popular set of timezones from IANA database

```tsx
import '@formatjs/intl-datetimeformat/polyfill'
import '@formatjs/intl-datetimeformat/add-golden-tz'
```

### Default Timezone

Since JS Engines do not expose default timezone, there's currently no way for us to detect local timezone that a browser is in. Therefore, the default timezone in this polyfill is `UTC`.

You can change this by either calling `__setDefaultTimeZone` or always explicitly pass in `timeZone` option for accurate date time calculation.

Since `__setDefaultTimeZone` is not in the spec, you should make sure to check for its existence before calling it & after tz data has been loaded, e.g:

```tsx
import '@formatjs/intl-datetimeformat/polyfill'
import '@formatjs/intl-datetimeformat/add-all-tz.js'

if ('__setDefaultTimeZone' in Intl.DateTimeFormat) {
  Intl.DateTimeFormat.__setDefaultTimeZone('America/Los_Angeles')
}
```

## Tests

This library is fully [test262](https://github.com/tc39/test262/tree/master/test/intl402/DateTimeFormat)-compliant.
