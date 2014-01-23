Intl Message Format
===================

![Build Status][TRAVIS]

Format a string with placeholders, including plural and select support to create localized messages.

Overview
--------
### Note
This `IntlMessageFormat` API may change to stay in sync with ECMA-402

### Goals

To provide a standardized way to concatenate strings with localization support in JavaScript on both the server and client.

### Basis
This implementation is based on the [Strawman Draft][STRAWMAN]. There are a few places this implementation diverges from the strawman draft. One such place is the pattern after it has been parsed. The strawman draft indicates the parsed arguments should be "flat" - where grouping options are at the same level as the `type` and `valueName`. This, as an example, would look like:
```
{
    type: "plural",
    valueName: "TRAVELER_COUNT",
    zero: "No travelers",
    one: "One traveler",
    two: "Two travelers",
    few: "There are a few travelers",
    many: "There are many travelers",
    other: "There are a lot of travelers"
}
```
This implementation takes a readability approach and places grouping options in an `options` key. This looks like:
```
{
    type: "plural",
    valueName: "TRAVELER_COUNT",
    options: {
        zero: "No travelers",
        one: "One traveler",
        two: "Two travelers",
        few: "There are a few travelers",
        many: "There are many travelers",
        other: "There are a lot of travelers"
    }
}
```

### How It Works

Messages are provided into the constructor as an `Array` or `String` messages.
```javascript
var msg = new IntlMessageFormat(pattern, locale, [optFieldFormatters]);
```

If a `String` is provided, it is parsed into a workable `Array` of tokens. This means
```javascript
"Welcome to {CITY}, {STATE}!"
```
becomes
```javascript
[
    "Welcome to ",
    {
        valueName: "CITY"
    },
    ", "
    {
        valueName: "STATE"
    },
    "!"
]
```

The pattern `Array` may contain `Strings` or `Objects`. Read more about [Token Objects](#token-objects)

The pattern is stored internally until the `format()` method is called with an `Object` containing parameters for generating the message. The pattern is then processed by converting the tokens into strings based on the parameters provided and concatenating the values together.


### Features
Custom formatters can be used to format the value __after__ it is gathered from the original process. Custom formatters are stored in the message during construction as the third parameter. Formatters are denoted in the argument with a comma (,) followed by the formatter name.

For example you can ensure that certain tokens are always upper cased:
```javascript
var msg = new IntlMessageFormat("Then they yelled '{YELL, upper}!'", "en", {
    "upper": function (val, locale) {
        return val.toString().toUpperCase();
    }
});

var m = msg.format({ YELL: "suprise" });

// Then they yelled 'SUPRISE!'
```

Installation
------------

Install using npm:

```shell
$ npm install intl-messageformat
```


Usage
-----
### IntlMessageFormat Constructor
To create a message to format, use the IntlMessageFormat constructor. The constructor has three parameters:

 - **pattern** - _{String|Array}_ - Array or string that serves as formatting pattern. Use array for plural and select messages, otherwise use string form.

 - **locale** - _{String}_ - Locale for string formatting. The locale is optional, but it is highly encouraged to provide a locale. If you do not provide a locale, the default locale will be used.

 - **optFieldFormatters** - _{Object}_ - (optional) Holds user defined formatters for each field

#### Creating a Message in Node.js
```javascript
var IntlMessageFormat = require('intl-messageformat');

// load some locales that you care about
require('intl-messageformat/locale-data/en');
require('intl-messageformat/locale-data/ar');
require('intl-messageformat/locale-data/pl');

var msg = new IntlMessageFormat("My name is {NAME}.", "en-US");
```

#### Creating a Message in a Browser
```javascript
var msg = new IntlMessageFormat("My name is {NAME}.", "en-US");
```

### Formatting a Message

Once the message is created, formatting the message is done by calling the `format` method of the instantiated object:

```javascript
var myNameIs = msg.format({ NAME: "Ferris Wheeler"});

// "My name is Ferris Wheeler."
```

### Token Objects
Token objects are created when the string is parsed. If you wish, you can create your own token objects. Token objects should always at least contain a `valueName`. There are a few other items that can be included:

- **`type`** _{String}_ - `plural` or `select` to identify the grouping type. Other values such as `number` and `date` are used to identify the type of the value and can be combined with a `format` string to identify a formatter to be used.

- **`valueName`** _{String}_ - key to match the `format` object

- **`format`** _{String|Function}_ - formatter used on the value after is discovered. Specifying the `type` is `"number"` and the `format` is `"integer"` would result in the default formatter `number_integer` being called

- **`options`** _{Object}_ - each key should be matched based on the `type` specified

 - **`zero`** _{String|Array}_ - (plural) Matched when the locale determines that the number is in the `"zero"` pluralization class

 - **`one`** _{String|Array}_ - (plural) Matched when the locale determines that the number is in the `"one"` pluralization class

 - **`two`** _{String|Array}_ - (plural) Matched when the locale determines that the number is in the `"two"` pluralization class

 - **`few`** _{String|Array}_ - (plural) Matched when the locale determines that the number is in the `"few"` pluralization class

 - **`many`** _{String|Array}_ - (plural) Matched when the locale determines that the number is in the `"many"` pluralization class

 - **`male`** _{String|Array}_ - (select) Matched when the `valueName` returns `"male"`

 - **`female`** _{String|Array}_ - (select) Matched when the `valueName` returns `"female"`

 - **`neuter`** _{String|Array}_ - (select) Matched when the `valueName` returns `"neuter"`

 - **`other`** _{String|Array}_ - (plural or select) Matched when `_normalizeCount` returns `"other"`, the `valueName` returns `"other"` or the returned value from either of those returns a value that is not specified. For instance, if `"male"` is returned and `"male"` is not specified, other will be matched.

When `options` is matched and returns an `Array`, that `Array` is then processed in the same manner. This means, large complex, conditional messages can be formed by defining the pattern as such.

Locale Data
-----------

This package ships with locale data for the top-level locales (e.g. `en` but not `en-US`). You can load the library and locale(s) using any of the following subpaths in the package:

* Load the base and then just the locale(s) that you need: `intl-messageformat/index.js` and `intl-messageformat/locale-data/{locale}.js`.

* Load the base with a single locale builtin: `intl-messageformat/build/intl-messageformat.{locale}.js')`. You can then optionally add more locale(s) as above.

* Load all locales: `intl-messageformat/build/intl-messageformat.complete.js`.


### Loading Locale Data in Node.js

**Please note** that if you are loading from the `locale-data/` directory that those files are expecting the library to be available in the `IntlMessageFormat` variable.


### Loading Locale Data in a Browser

Every `intl-messageformat/build/*.js` file also has an `intl-messageformat/build/*.min.js` equivalent which has already been minified.


Examples
--------


#### Simple String
```javascript
var msg = new IntlMessageFormat("My name is {name}.", "en-US");

var myNameIs = msg.format({ name: "Ferris Wheeler"});

// "My name is Ferris Wheeler."
```


#### Complex Formatting
```javascript
var msg = new IntlMessageFormat(['Some text before ', {
    type: 'plural',
    valueName: 'NUM_PEOPLE',
    offset: 1,
    options: {
        one: 'Some message ${PH} with ${#} value',

        few: ['Optional prefix text for |few| ', {
            type: 'select',
            valueName: 'GENDER',
            options: {
                male: 'Text for male option with \' single quotes',
                female: 'Text for female option with {}',
                other: 'Text for default'
            }
        }, ' optional postfix text'],

        other: 'Some messages for the default'
    }
}, ' and text after'], "en-US");

var complex = msg.format({
    NUM_PEOPLE: 4,
    PH: 'whatever',
    GENDER: 'male'
});

// "Some text before Optional prefix text for |few| Text for male option with ' single quotes optional postfix text and text after"
```

#### User Defined Formatters
User defined formatters are provided to the IntlMessageFormat as the third parameter. To denote a key should be process through a formatter, you need only provide the formatter name after the token key. Such as, `{key}` would then become `{key, formatter}`. This is an example of using the Intl.NumberFormat to create a currency formatter.

```
var msg = new IntlMessageFormatter("I just made {TOTAL, currency}!!", "en-US", {
    currency: function (val, locale) {
        return new Intl.NumberFormat(val, {
            style: 'currency',
            currency: 'USD',
            currencyDisplay: 'symbol'
        });
    }
});

var payday = msg.format({ TOTAL: 3 });

// I just made $3.00!!
```


API
---

### Constructor

Creates IntlMessageFormat object from a pattern, locale and field formatters. String patterns are broken down to Arrays. Objects should match the following pattern:

```javascript
{
    type: 'plural|select',
    valueName: 'string',
    offset: 1, // consistent offsets for plurals
    options: {}, // keys match options for plurals and selects
    format: 'string|function' // strings are matched to internal formatters
}
```

**Parameters**

- **`pattern`**: _{Array|String}_ `Array` or `String` that serves as formatting
pattern. An `Array` may consist of `Strings` and [Token Objects](#token-objects).

- **`locale`**: _{String}_ Locale for string formatting and when using plurals and formatters.

- **`optFieldFormatters`**: _{Object}_ Holds user defined formatters for each
field

### Instace Methods

#### format(data)
Formats the pattern with supplied parameters. Dates, times and numbers are formatted in locale sensitive way when used with a formatter.

_PARAMETERS_

- **`data`**: _{Object}_ Object used to choose options when formatting the message


#### resolvedOptions
**_NOT YET DETERMINED_**
Returns resolved options, in this case supported locale.


License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][LICENSE] for license text and copyright information.



[TRAVIS]: https://travis-ci.org/yahoo/intl-messageformat.png?branch=master
[STRAWMAN]: http://wiki.ecmascript.org/doku.php?id=globalization:messageformatting
[LICENSE]: https://github.com/yahoo/intl-messageformat/blob/master/LICENSE

