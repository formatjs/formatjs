# `intl-pluralrules`

A polyfill for [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules). 
## Installation

```
npm install @formatjs/intl-pluralrules
```

## Requirements

This package requires the following capabilities:

- [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat)

# Usage

```tsx
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/dist/locale-data/en'; // locale-data for en
```

TO polyfill w/ ALL locales:

```tsx
import '@formatjs/intl-pluralrules/polyfill-locales';
```
