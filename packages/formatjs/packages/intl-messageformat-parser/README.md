# Intl MessageFormat Parser

Parses [ICU Message strings][icu] into an AST via JavaScript.

[![npm Version](https://badgen.net/npm/v/intl-messageformat-parser)](https://www.npmjs.com/package/intl-messageformat-parser)
[![size](https://badgen.net/bundlephobia/minzip/intl-messageformat-parser)](https://bundlephobia.com/result?p=intl-messageformat-parser)

## Overview

This package implements a parser in JavaScript that parses the industry standard [ICU Message strings][icu] — used for internationalization — into an AST. The produced AST can then be used by a compiler, like [`intl-messageformat`][intl-mf], to produce localized formatted strings for display to users.

This parser is written in [PEG.js][], a parser generator for JavaScript.

## Usage

```ts
import {parse} from 'intl-messageformat-parser';
const ast = parse('this is {count, plural, one{# dog} other{# dogs}}');
```

### Example

Given an ICU Message string like this:

```
On {takenDate, date, short} {name} took {numPhotos, plural,
    =0 {no photos.}
    =1 {one photo.}
    other {# photos.}
}
```

```js
// Assume `msg` is the string above.
parse(msg);
```

This parser will produce this AST:

```json
[
  {
    "type": 0,
    "value": "On "
  },
  {
    "type": 3,
    "style": "short",
    "value": "takenDate"
  },
  {
    "type": 0,
    "value": " "
  },
  {
    "type": 1,
    "value": "name"
  },
  {
    "type": 0,
    "value": " took "
  },
  {
    "type": 6,
    "pluralType": "cardinal",
    "value": "numPhotos",
    "offset": 0,
    "options": [
      {
        "id": "=0",
        "value": [
          {
            "type": 0,
            "value": "no photos."
          }
        ]
      },
      {
        "id": "=1",
        "value": [
          {
            "type": 0,
            "value": "one photo."
          }
        ]
      },
      {
        "id": "other",
        "value": [
          {
            "type": 0,
            "value": "# photos."
          }
        ]
      }
    ]
  }
]
```

## Supported DateTime Skeleton

ICU provides a [wide array of pattern](https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table) to customize date time format. However, not all of them are available via ECMA402's Intl API. Therefore, our parser only support the following patterns

| Symbol | Meaning                       | Notes                     |
| ------ | ----------------------------- | ------------------------- |
| G      | Era designator                |
| y      | year                          |
| M      | month in year                 |
| L      | stand-alone month in year     |
| d      | day in month                  |
| E      | day of week                   |
| e      | local day of week             | `e..eee` is not supported |
| c      | stand-alone local day of week | `c..ccc` is not supported |
| a      | AM/PM marker                  |
| h      | Hour [1-12]                   |
| H      | Hour [0-23]                   |
| K      | Hour [0-11]                   |
| k      | Hour [1-24]                   |
| m      | Minute                        |
| s      | Second                        |
| z      | Time Zone                     |

## Benchmarks

```
complex_msg AST length 2053
normal_msg AST length 410
simple_msg AST length 79
string_msg AST length 36
complex_msg x 3,926 ops/sec ±2.37% (90 runs sampled)
normal_msg x 27,641 ops/sec ±3.93% (86 runs sampled)
simple_msg x 100,764 ops/sec ±5.35% (79 runs sampled)
string_msg x 120,362 ops/sec ±7.11% (74 runs sampled)
```

[icu]: http://userguide.icu-project.org/formatparse/messages
[intl-mf]: https://github.com/formatjs/formatjs
[peg.js]: https://pegjs.org/
