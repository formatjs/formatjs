/* jslint -W040, node: true */

'use strict';

// IntlMessageFormat and Intl are dependencies of this package. The built-in
// `Intl` is preferred, but when not available it looks for the polyfill.
var Intl              = global.Intl || global.IntlPolyfill,
    IntlMessageFormat = global.IntlMessageFormat,
    // Cache to hold NumberFormat and DateTimeFormat instances for reuse.
    formats = {
        number: {},
        date  : {}
    };

if (!Intl) {
    throw new ReferenceError('Intl must be available.');
}

if (!IntlMessageFormat) {
    throw new ReferenceError('IntlMessageFormat must be available.');
}

function intlResolve(name) {
    var current = this._owner;
    // TODO: add cache layer to avoid the penalty of the lookup
    while (current && !current.props[name]) {
        current = current._owner;
    }
    if (!current || !current.props[name]) {
        console.warn('Could not resolve prop `' + name + '` thru owners chain.' );
    }
    return current && current.props[name];
}

function intlLocales() {
    return this.props.locales || this.intlResolve('locales');
}

function intlFormats() {
    return this.props.formats || this.intlResolve('formats');
}

function intlDate(date, formatOptions) {
    var locales = this.intlLocales(),
        formats = this.intlFormats();

    date = new Date(date);

    // Determine if the `date` is valid.
    if (!(date && date.getTime())) {
        throw new TypeError('A date must be provided.');
    }

    if (formatOptions) {
        if (typeof formatOptions === 'string') {
            try {
                formatOptions = formats.date[formatOptions];
            } catch (e) {
                throw new ReferenceError('Invalid date formatter: `' + formatOptions + '`.');
            }
        }

        formatOptions = extend({}, formatOptions);
    }

    return getFormat('date', locales, formatOptions).format(date);
}

function intlNumber(num, formatOptions) {
    var locales = this.intlLocales(),
        formats = this.intlFormats();

    if (typeof num !== 'number') {
        throw new TypeError('A number must be provided.');
    }

    if (formatOptions) {
        if (typeof formatOptions === 'string') {
            try {
                formatOptions = formats.number[formatOptions];
            } catch (e) {
                throw new ReferenceError('Invalid number formatter: `' + formatOptions + '`.');
            }
        }

        formatOptions = extend({}, formatOptions);
    }

    return getFormat('number', locales, formatOptions).format(num);
}

function intlMessage(message, values) {
    var locales = this.intlLocales(),
        formats = this.intlFormats();

    // When `message` is a function, assume it's an IntlMessageFormat
    // instance's `format()` method passed by reference, and call it.
    // This is possible because its `this` will be pre-bound to the
    // instance.
    if (typeof message === 'function') {
        return message(values);
    }

    // Assume that an object with a `format()` method is already an
    // IntlMessageFormat instance, and use it; otherwise create a new
    // one.
    if (typeof message.format !== 'function') {
        message = new IntlMessageFormat(message, locales, formats);
    }

    return message.format(values);
}

// -- Utilities ------------------------------------------------------------

function getFormat(type, locales, options) {
    var orderedOptions, option, key, i, len, id, format;

    // When JSON is available in the environment, use it build a cache-id
    // to reuse formats for increased performance.
    if (global.JSON) {
        // Order the keys in `options` to create a serialized semantic
        // representation which is reproducible.
        if (options) {
            orderedOptions = [];

            for (key in options) {
                if (options.hasOwnProperty(key)) {
                    orderedOptions.push(key);
                }
            }

            orderedOptions.sort();

            for (i = 0, len = orderedOptions.length; i < len; i += 1) {
                key    = orderedOptions[i];
                option = {};

                option[key] = options[key];
                orderedOptions[i] = option;
            }
        }

        id = global.JSON.stringify([locales, orderedOptions]);
    }

    // Check for a cached format instance, and use it.
    format = formats[type][id];
    if (format) { return format; }

    switch (type) {
        case 'number':
            format = new Intl.NumberFormat(locales, options);
            break;
        case 'date':
            format = new Intl.DateTimeFormat(locales, options);
            break;
    }

    // Cache format for reuse.
    if (id) {
        formats[type][id] = format;
    }

    return format;
}

function extend(obj) {
    var sources = Array.prototype.slice.call(arguments, 1),
        i, len, source, key;

    for (i = 0, len = sources.length; i < len; i += 1) {
        source = sources[i];
        if (!source) { continue; }

        for (key in source) {
            if (source.hasOwnProperty(key)) {
                obj[key] = source[key];
            }
        }
    }

    return obj;
}

// -- exports---------------------------------------------------------------

global.ReactIntlMixin = {
    // getDefaultProps: function () {
    //     return {
    //         locales: this.intlLocales(),
    //         formats: this.intlFormats()
    //     };
    // },
    intlLocales: intlLocales,
    intlFormats: intlFormats,
    intlResolve: intlResolve,
    intlDate   : intlDate,
    intlNumber : intlNumber,
    intlMessage: intlMessage
};
