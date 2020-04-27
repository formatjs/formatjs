# intl-locales-supported

Utility to help you determine if your runtime has modern Intl API & locales support. This specifically checks for `Intl.NumberFormat`, `Intl.PluralRules` & `Intl.RelativeTimeFormat` and is being used by `react-intl`.

[![npm Version](https://badgen.net/npm/v/intl-locales-supported)](https://www.npmjs.org/package/intl-locales-supported)
![size](https://badgen.net/bundlephobia/minzip/intl-locales-supported)

## Usage

```js
const areIntlLocalesSupported = require('intl-locales-supported');

const localesMyAppSupports = [
  /* list locales here */
];

// Determine if the built-in `Intl` has the locale data we need.
if (
  !areIntlLocalesSupported(localesMyAppSupports, [
    Intl.PluralRules,
    Intl.RelativeTimeFormat,
  ])
) {
  // `Intl` exists, but it doesn't have the data we need, so load the
  // polyfill and replace the constructors we need with the polyfill's.
  require('@formatjs/intl-pluralrules/polyfill');
  require('@formatjs/intl-pluralrules/dist/locale-data/de'); // Load de

  require('@formatjs/intl-relativetimeformat/polyfill');
  require('@formatjs/intl-relativetimeformat/dist/locale-data/de'); // Load de
}
```
