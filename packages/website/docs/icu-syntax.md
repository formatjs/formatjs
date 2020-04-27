---
id: icu-syntax
title: Message Syntax
---

If you are translating text you'll need a way for your translators to express the subtleties of spelling, grammar, and conjugation inherent in each language. We use the [ICU Message syntax](http://userguide.icu-project.org/formatparse/messages) which is also used in Java and PHP.

The [`intl-messageformat`](https://www.npmjs.org/package/intl-messageformat) library takes the message and input data and creates an appropriately formatted string. This feature is included with all of the integrations we provide.

The following sections describe the ICU Message syntax and show how to use this features provided the FormatJS libraries:

## Basic Principles

The simplest transform for the message is a literal string.

```html
Hello everyone
```

All other transforms are done using replacements called "arguments". They are enclosed in curly braces (`{` and `}`) and refer to a value in the input data.

## Simple Argument

You can use a `{key}` argument for placing a value into the message. The key is looked up in the input data, and the string is interpolated with its value.

```
Hello {who}
```

## Formatted Argument

Values can also be formatted based on their type. You use a `{key, type, format}` argument to do that.

The elements of the argument are:

- `key` is where in the input data to find the data
- `type` is how to interpret the value (see below)
- `format` is optional, and is a further refinement on how to display that type of data

```
I have {numCats, number} cats.
```

### `number` Type

This type is used to format numbers in a way that is sensitive to the locale. It understands the following values for the optional `format` element of the argument:

```
I have {numCats, number} cats.
Almost {pctBlack, number, ::percent} of them are black.
```

Internally it uses the Intl.NumberFormat API. You can define custom values for the `format` element, which are passed to the Intl.NumberFormat constructor.

Sometimes embedding how the number will be formatted provides great context to translators. We also support ICU Number Skeletons using the same syntax:

```
The price of this bagel is {num, number, ::sign-always compact-short currency/GBP}
```

You can read more about this [here](https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md).

### `date` Type

This type is used to format dates in a way that is sensitive to the locale. It understands the following values for the optional format element of the argument:

- `short` is used to format dates in the shortest possible way
- `medium` is used to format dates with short textual representation of the month
- `long` is used to format dates with long textual representation of the month
- `full` is used to format dates with the most detail

```
Sale begins {start, date, medium}
```

Internally it uses the `Intl.DateTimeFormat` API. You can define custom values for the format element, which are passed to the `Intl.DateTimeFormat` constructor.

### `time` Type

This type is used to format times in a way that is sensitive to the locale. It understands the following values for the optional format element of the argument:

- `short` is used to format times with hours and minutes
- `medium` is used to format times with hours, minutes, and seconds
- `long` is used to format times with hours, minutes, seconds, and timezone
- `full` is the same as long

```
Coupon expires at {expires, time, short}
```

Internally it uses the `Intl.DateTimeFormat` API. You can define custom values for the format element, which are passed to the `Intl.DateTimeFormat` constructor.

### Supported DateTime Skeleton

Similar to `number` type, we also support ICU DateTime skeleton. ICU provides a [wide array of pattern](https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table) to customize date time format. However, not all of them are available via ECMA402's Intl API. Therefore, we only support the following patterns

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

### `{select}` Format

The `{key, select, matches}` is used to choose output by matching a value to one of many choices. (It is similar to the `switch` statement available in some programming languages.) The key is looked up in the input data. The corresponding value is matched to one of matches and the corresponding output is returned. The `matches` is a space-separated list of `matches`.

The format of a match is match `{output}`. (A match is similar to the case statement of the switch found in some programming languages.) The `match` is a literal value. If it is the same as the value for `key` then the corresponding `output` will be used.

output is itself a message, so it can be a literal string or also have more arguments nested inside of it.

The other match is special and is used if nothing else matches. (This is similar to the default case of the switch found in some programming languages.)

```
{gender, select,
    male {He}
    female {She}
    other {They}
} will respond shortly.
```

Here's an example of nested arguments.

```
{taxableArea, select,
    yes {An additional {taxRate, number, percent} tax will be collected.}
    other {No taxes apply.}
}
```

### `{plural}` Format

The `{key, plural, matches}` is used to choose output based on the pluralization rules of the current locale. It is very similar to the `{select}` format above except that the value is expected to be a number and is mapped to a plural category.

The match is a literal value and is matched to one of these plural categories. Not all languages use all plural categories.

- `zero`: This category is used for languages that have grammar specialized specifically for zero number of items. (Examples are Arabic and Latvian.)
- `one`: This category is used for languages that have grammar specialized specifically for one item. Many languages, but not all, use this plural category. (Many popular Asian languages, such as Chinese and Japanese, do not use this category.)
- `two`: This category is used for languages that have grammar specialized specifically for two items. (Examples are Arabic and Welsh.)
- `few`: This category is used for languages that have grammar specialized specifically for a small number of items. For some languages this is used for 2-4 items, for some 3-10 items, and other languages have even more complex rules.
- `many`: This category is used for languages that have grammar specialized specifically for a larger number of items. (Examples are Arabic, Polish, and Russian.)
- `other`: This category is used if the value doesn't match one of the other plural categories. Note that this is used for "plural" for languages (such as English) that have a simple "singular" versus "plural" dichotomy.
- `=value`: This is used to match a specific value regardless of the plural categories of the current locale.

```
Cart: {itemCount} {itemCount, plural,
    one {item}
    other {items}
}
```

```
You have {itemCount, plural,
    =0 {no items}
    one {1 item}
    other {{itemCount} items}
}.
```

In the `output` of the match, the `#` special token can be used as a placeholder for the numeric value and will be formatted as if it were `{key, number}`.

```
You have {itemCount, plural,
    =0 {no items}
    one {# item}
    other {# items}
}.
```

### `{selectordinal}` Format

The `{key, selectordinal, matches}` is used to choose output based on the ordinal pluralization rules (1st, 2nd, 3rd, etc.) of the current locale. It is very similar to the {plural} format above except that the value is mapped to an ordinal plural category.

The match is a literal value and is matched to one of these plural categories. Not all languages use all plural categories.

- `zero`: This category is used for languages that have grammar specialized specifically for zero number of items. (Examples are Arabic and Latvian.)
- `one`: This category is used for languages that have grammar specialized specifically for one item. Many languages, but not all, use this plural category. (Many popular Asian languages, such as Chinese and Japanese, do not use this category.)
- `two`: This category is used for languages that have grammar specialized specifically for two items. (Examples are Arabic and Welsh.)
- `few`: This category is used for languages that have grammar specialized specifically for a small number of items. For some languages this is used for 2-4 items, for some 3-10 items, and other languages have even more complex rules.
- `many`: This category is used for languages that have grammar specialized specifically for a larger number of items. (Examples are Arabic, Polish, and Russian.)
- `other`: This category is used if the value doesn't match one of the other plural categories. Note that this is used for "plural" for languages (such as English) that have a simple "singular" versus "plural" dichotomy.
- `=value`: This is used to match a specific value regardless of the plural categories of the current locale.

In the `output` of the match, the `#` special token can be used as a placeholder for the numeric value and will be formatted as if it were `{key, number}`.

```
It's my cat's {year, selectordinal,
    one {#st}
    two {#nd}
    few {#rd}
    other {#th}
} birthday!
```

## Rich Text Formatting

We also support embedded rich text formatting in our message using tags. This allows developers to embed as much text as possible so sentences don't have to be broken up into chunks
**NOTE: This is not XML/HTML tag**

```
Our price is <boldThis>{price, number, ::currency/USD precision-integer}</boldThis>
with <link>{pct, number, ::percent} discount</link>
```
