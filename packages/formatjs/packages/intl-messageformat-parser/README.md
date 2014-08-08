intl-messageformat-parser
=========================

Parses ICU message strings to an AST that can be used to format the messages for
a person's locale.

[![npm Version](https://img.shields.io/npm/v/intl-messageformat-parser.svg?style=flat)][npm]
[![Dependency Status](https://img.shields.io/david/yahoo/intl-messageformat-parser.svg?style=flat)][david]

[npm]: https://www.npmjs.org/package/intl-messageformat-parser
[david]: https://david-dm.org/yahoo/intl-messageformat-parser

Usage
-----

Given a message like this:

```js
var photosMsg = 'On {takenDate, date, short} {name} took {numPhotos, plural,' +
    '=0 {no photos :(}' +
    '=1 {one photo.}' +
    'other {# photos!}}';

parser.parse(msg);
```

This parser will produce this AST:

```json
{
    "type": "messageFormatPattern",
    "elements": [
        {
            "type": "messageTextElement",
            "value": "On "
        },
        {
            "type": "argumentElement",
            "id": "takenDate",
            "format": {
                "type": "dateFormat",
                "style": "short"
            }
        },
        {
            "type": "messageTextElement",
            "value": " "
        },
        {
            "type": "argumentElement",
            "id": "name",
            "format": null
        },
        {
            "type": "messageTextElement",
            "value": " took "
        },
        {
            "type": "argumentElement",
            "id": "numPhotos",
            "format": {
                "type": "pluralFormat",
                "offset": 0,
                "options": [
                    {
                        "type": "optionalFormatPattern",
                        "selector": "=0",
                        "value": {
                            "type": "messageFormatPattern",
                            "elements": [
                                {
                                    "type": "messageTextElement",
                                    "value": "no photos :("
                                }
                            ]
                        }
                    },
                    {
                        "type": "optionalFormatPattern",
                        "selector": "=1",
                        "value": {
                            "type": "messageFormatPattern",
                            "elements": [
                                {
                                    "type": "messageTextElement",
                                    "value": "one photo."
                                }
                            ]
                        }
                    },
                    {
                        "type": "optionalFormatPattern",
                        "selector": "other",
                        "value": {
                            "type": "messageFormatPattern",
                            "elements": [
                                {
                                    "type": "messageTextElement",
                                    "value": "# photos!"
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ]
}
```

License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.

[LICENSE file]: /blob/master/LICENSE
