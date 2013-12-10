Intl Message Format Polyfill
============================

[![Build Status](https://travis-ci.org/yahoo/intl-messageformat.png?branch=master)](https://travis-ci.org/yahoo/intl-messageformat)

Format a string with placeholders, including plural and gender support to
create localized messages.


Overview
--------

### Goals

To provide a standardized way to concatenate strings with localization support
in JavaScript on both the server and client.

### How It Works

Messages are provided into the constructor as Arrays or simple String
messages. Strings are then broken up and processed into a workable Array. The
Array is stored internally until the format method is called with an Object
containing parameters for generating the message. The Array is then processed
by converting Objects into strings based on the paramters provided and
concatenating the values together.

### Features
Custom formatters can be used to format the value __after__ it is gathered from
the original process. Custom formatters are applied to the message during
construction.


Installation
------------

Install using npm:

```shell
$ npm install intl-messageformat
```

Usage
-----

### Creating a message in Node.js

Message creating is done using the MessageFormat contstructor as:

```javascript
var MessageFormat = require('intl-messageformat');

var msg = new MessageFormat("My name is ${name}.");
```

### Creating a message in a browser

Message creation is done using the MessageFormat constructor as:

```javascript
var msg = new MessageFormat("My name is ${name}.");
```

### Formatting a message

Once the message is created, formatting the message is done by calling the
`format` method of the instantiated object:

```javascript
var myNameIs = msg.format({ name: "Ferris Wheeler"});

// myNameIs === "My name is Ferris Wheeler."
```

Examples
--------
#### Simple String
```javascript
var msg = new MessageFormat("My name is ${name}.");

var myNameIs = msg.format({ name: "Ferris Wheeler"});

// myNameIs === "My name is Ferris Wheeler."
```

#### Complex Formatting
```javascript
var msg = new MessageFormat(['Some text before ', {
    type: 'plural',
    valueName: 'numPeople',
    offset: 1,
    options: {
        one: 'Some message ${ph} with ${#} value',

        few: ['Optional prefix text for |few| ', {
            type: 'select',
            valueName: 'gender',
            options: {
                male: 'Text for male option with \' single quotes',
                female: 'Text for female option with {}',
                other: 'Text for default'
            }
        }, ' optional postfix text'],

        other: 'Some messages for the default',

            '1': ['Optional prefix text ', {
            type: 'select',
            valueName: 'gender',
            options: {
                male: 'Text for male option with \' single quotes',
                female: 'Text for female option with {}',
                other: 'Text for default'
            }
        }, ' optional postfix text'],
    }
}, ' and text after']);

var complex = msg.format({
    numPeople: 4,
    ph: 'whatever',
    gender: 'male'
});

// complex === "Some text before Optional prefix text for |few| Text for male option with ' single quotes optional postfix text and text after"
```

API
---

### Constructor

Creates MessageFormat object from a pattern, locale and field formatters.
String patterns are broken down Arrays. Objects should match the
following pattern:

```javascript
{
    type: 'plural|gender|select',
    valueName: 'string',
    offset: 1, // consistent offsets for plurals
    options: {}, // keys match options for plurals, gender and selects
    formatter: 'string|function' // strings are matched to internal formatters
}
```

**Parameters**

* `locale`: __{LocaleList|String}__ Locale for string formatting and when Date
and Number

* `pattern`: __{Array|String}__ Array or string that serves as formatting
pattern

* `optFieldFormatters`: __{Object}__ Holds user defined formatters for each
field



### Instace Methods

#### `format`
Formats pattern with supplied parameters.
Dates, times and numbers are formatted in locale sensitive way.

**Parameters**

* `params`: __{Array|Object}__ Object used to choose options when formatting
the message


#### `resolvedOptions`
Returns resolved options, in this case supported locale.


License
-------

This software is free to use under the Yahoo Inc. MIT license.
See the [LICENSE file][] for license text and copyright information.


[LICENSE file]: https://github.com/yahoo/intl-messageformat-polyfill/blob/master/LICENSE
