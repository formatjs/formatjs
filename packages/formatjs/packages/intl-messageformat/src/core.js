/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */

import {extend, hop} from './utils';
import {defineProperty, objCreate, fnBind} from './es5';
import Compiler from './compiler';
import parser from 'intl-messageformat-parser';

export default MessageFormat;

// -- MessageFormat --------------------------------------------------------

function MessageFormat(message, locales, formats) {
    // Parse string messages into an AST.
    var ast = typeof message === 'string' ?
            MessageFormat.__parse(message) : message;

    if (!(ast && ast.type === 'messageFormatPattern')) {
        throw new TypeError('A message must be provided as a String or AST.');
    }

    // Creates a new object with the specified `formats` merged with the default
    // formats.
    formats = this._mergeFormats(MessageFormat.FORMATS, formats);

    // Defined first because it's used to build the format pattern.
    defineProperty(this, '_locale',  {value: this._resolveLocale(locales)});

    var pluralFn = MessageFormat.__localeData__[this._locale].pluralFunction;

    // Define the `pattern` property, a compiled pattern that is highly
    // optimized for repeated `format()` invocations. **Note:** This passes the
    // `locales` set provided to the constructor instead of just the resolved
    // locale.
    var pattern = this._compilePattern(ast, locales, formats, pluralFn);
    defineProperty(this, '_pattern', {value: pattern});

    // Bind `format()` method to `this` so it can be passed by reference like
    // the other `Intl` APIs.
    this.format = fnBind.call(this.format, this);
}

// Default format options used as the prototype of the `formats` provided to the
// constructor. These are used when constructing the internal Intl.NumberFormat
// and Intl.DateTimeFormat instances.
defineProperty(MessageFormat, 'FORMATS', {
    enumerable: true,

    value: {
        number: {
            'currency': {
                style: 'currency'
            },

            'percent': {
                style: 'percent'
            }
        },

        date: {
            'short': {
                month: 'numeric',
                day  : 'numeric',
                year : '2-digit'
            },

            'medium': {
                month: 'short',
                day  : 'numeric',
                year : 'numeric'
            },

            'long': {
                month: 'long',
                day  : 'numeric',
                year : 'numeric'
            },

            'full': {
                weekday: 'long',
                month  : 'long',
                day    : 'numeric',
                year   : 'numeric'
            }
        },

        time: {
            'short': {
                hour  : 'numeric',
                minute: 'numeric'
            },

            'medium':  {
                hour  : 'numeric',
                minute: 'numeric',
                second: 'numeric'
            },

            'long': {
                hour        : 'numeric',
                minute      : 'numeric',
                second      : 'numeric',
                timeZoneName: 'short'
            },

            'full': {
                hour        : 'numeric',
                minute      : 'numeric',
                second      : 'numeric',
                timeZoneName: 'short'
            }
        }
    }
});

// Define internal private properties for dealing with locale data.
defineProperty(MessageFormat, '__availableLocales__', {value: []});
defineProperty(MessageFormat, '__localeData__', {value: objCreate(null)});
defineProperty(MessageFormat, '__addLocaleData', {value: function (data) {
    if (!(data && data.locale)) {
        throw new Error('Object passed does not identify itself with a valid language tag');
    }

    if (!data.messageformat) {
        throw new Error('Object passed does not contain locale data for IntlMessageFormat');
    }

    var availableLocales = MessageFormat.__availableLocales__,
        localeData       = MessageFormat.__localeData__;

    // Message format locale data only requires the first part of the tag.
    var locale = data.locale.toLowerCase().split('-')[0];

    availableLocales.push(locale);
    localeData[locale] = data.messageformat;

    // Assign as `defaultLocale` if there isn't already a default.
    if (!MessageFormat.defaultLocale) {
        MessageFormat.defaultLocale = locale;
    }
}});

// Defines `__parse()` static method as an exposed private.
defineProperty(MessageFormat, '__parse', {value: parser.parse});

// Define public `defaultLocale` property which is set when the first bundle of
// locale data is added.
defineProperty(MessageFormat, 'defaultLocale', {
    enumerable: true,
    writable  : true,
    value     : undefined
});

MessageFormat.prototype.format = function (values) {
    return this._format(this._pattern, values);
};

MessageFormat.prototype.resolvedOptions = function () {
    // TODO: Provide anything else?
    return {
        locale: this._locale
    };
};

MessageFormat.prototype._compilePattern = function (ast, locales, formats, pluralFn) {
    var compiler = new Compiler(locales, formats, pluralFn);
    return compiler.compile(ast);
};

MessageFormat.prototype._format = function (pattern, values) {
    var result = '',
        i, len, part, id, value;

    for (i = 0, len = pattern.length; i < len; i += 1) {
        part = pattern[i];

        // Exist early for string parts.
        if (typeof part === 'string') {
            result += part;
            continue;
        }

        id = part.id;

        // Enforce that all required values are provided by the caller.
        if (!(values && hop.call(values, id))) {
            throw new Error('A value must be provided for: ' + id);
        }

        value = values[id];

        // Recursively format plural and select parts' option — which can be a
        // nested pattern structure. The choosing of the option to use is
        // abstracted-by and delegated-to the part helper object.
        if (part.options) {
            result += this._format(part.getOption(value), values);
        } else {
            result += part.format(value);
        }
    }

    return result;
};

MessageFormat.prototype._mergeFormats = function (defaults, formats) {
    var mergedFormats = {},
        type, mergedType;

    for (type in defaults) {
        if (!hop.call(defaults, type)) { continue; }

        mergedFormats[type] = mergedType = objCreate(defaults[type]);

        if (formats && hop.call(formats, type)) {
            extend(mergedType, formats[type]);
        }
    }

    return mergedFormats;
};

MessageFormat.prototype._resolveLocale = function (locales) {
    var availableLocales = MessageFormat.__availableLocales__,
        locale, parts, i, len;

    if (availableLocales.length === 0) {
        throw new Error('No locale data has been provided for IntlMessageFormat yet');
    }

    if (typeof locales === 'string') {
        locales = [locales];
    }

    if (locales && locales.length) {
        for (i = 0, len = locales.length; i < len; i += 1) {
            locale = locales[i].toLowerCase().split('-')[0];

            // Make sure the first part of the locale that we care about is
            // structurally valid.
            if (!/[a-z]{2,3}/i.test(locale)) {
                throw new RangeError('"' + locales[i] + '" is not a structurally valid language tag');
            }

            if (availableLocales.indexOf(locale) >= 0) {
                break;
            }
        }
    }

    return locale || MessageFormat.defaultLocale;
};
