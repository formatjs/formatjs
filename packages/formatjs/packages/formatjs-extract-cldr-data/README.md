# FormatJS Extract CLDR Data

Utility library that extracts the [CLDR][] data that's needed by the [FormatJS][] libraries.

[![npm Version][npm-badge]][npm]

## Usage

This package offers a function to extract the CLDR data needed by the FormatJS libraries via its default export. The data is returned as an object keyed by locale language tags; e.g., `"en-US"`. This package leverages the fact that language tags are hierarchical and will only return the unique, de-duplicated data that's needed.

The following example shows how the locale hierarchy is used to return the unique data:

```js
var extractData = require('formatjs-extract-cldr-data');

var data = extractData({
    locales    : ['en-US', 'en-GB'],
    pluralRules: true
});

console.log(data); // =>

{ 'en-US': { locale: 'en-US', parentLocale: 'en' },
  'en-GB': { locale: 'en-GB', parentLocale: 'en-001' },
  'en-001': { locale: 'en-001', parentLocale: 'en' } },
  en: { locale: 'en', pluralRuleFunction: [Function] }
```

Since the `pluralRuleFunction` for the root locale `"en"` is the same as used in the locales: `"en-US"` and `"en-GB"`, the function is located in the "en" entry. The entries for the `en-*` locales all contain a `parentLocale` property which can be followed up to `"en"`.

### Data Shape

The data object returned from this package will have the following shape, here's the data for US English:

```js
{ en:
   { locale: 'en',
     pluralRuleFunction: [Function],
     fields:
      { year: [Object],
        "year-short": [Object],
        month: [Object],
        "month-short": [Object],
        week: [Object],
        "week-short": [Object],
        day: [Object],
        "day-short": [Object],
        hour: [Object],
        "hour-short": [Object],
        minute: [Object],
        "minute-short": [Object],
        second: [Object],
        "second-short": [Object] } } }
```

Each field has the following shape, here's the data for English `year`:

```js
{ displayName: 'Year',
  relative: { '0': 'this year', '1': 'next year', '-1': 'last year' },
  relativeTime:
   { future: { one: 'in {0} year', other: 'in {0} years' },
     past: { one: '{0} year ago', other: '{0} years ago' } } }
```

### Options

In order for any data to be returned, the value `true` must be assigned to either the `pluralRules` and/or `relativeFields` options. By default, data will be returned for all locales in the CLDR; to limit which locales, assign an array of them to the `locales` option.

#### `locales`

An optional array of locales to extract data for, specified as string language tags. By default, data will be returned for all locales in the CLDR.

**Note:** This package leverages the language tag hierarchy to de-duplicate data and also normalizes the casing of language tags. There will be an entry for every locale specified in `locales`, _plus_ an entry to each parent locale up to the root. When a locale has a parent, a `parentLocale` field will be present in
that locale's entry.

#### `pluralRules`

Boolean for whether or not `pluralRuleFunction`s should be extracted for the specified `locales`. These functions will support both cardinal and ordinal pluralization. These functions are generated using the [make-plural][] project.

#### `relativeFields`

Boolean for whether or not `fields` should be extracted for the specified `locales`. The field data that's extracted is limited to the data required to support FormatJS' relative time formatting features, and it's organized in the shape described above.

## Updating the CLDR Data

The CLDR version and data used by this package can be easily updated by changing the `cldr-*` package versions in `package.json`.

**Note:** It's recommended to keep the package versions exact and **not** use `~` or `^` modifiers.

## License

The CLDR data contained in this packaged is licensed under the Apache, ICU, and Unicode licenses. See the [Unicode® Copyright and Terms of Use][https://unicode.org/copyright.html] for their license text and copyright information.

[cldr]: http://cldr.unicode.org/
[formatjs]: http://formatjs.io/
[npm]: https://www.npmjs.org/package/formatjs-extract-cldr-data
[npm-badge]: https://img.shields.io/npm/v/formatjs-extract-cldr-data.svg?style=flat-square
