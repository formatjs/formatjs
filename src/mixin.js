/* jshint esnext:true */

// TODO: Use `import React from "react";` when external modules are supported.
import React from './react';

import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';
import createFormatCache from 'intl-format-cache';

// -----------------------------------------------------------------------------

var typesSpec = {
    locales: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.array
    ]),

    formats : React.PropTypes.object,
    messages: React.PropTypes.object
};

function assertIsDate(date, errMsg) {
    // Determine if the `date` is valid by checking if it is finite, which is
    // the same way that `Intl.DateTimeFormat#format()` checks.
    if (!isFinite(date)) {
        throw new TypeError(errMsg);
    }
}

function assertIsNumber(num, errMsg) {
    if (typeof num !== 'number') {
        throw new TypeError(errMsg);
    }
}

export default {
    statics: {
        filterFormatOptions: function (obj) {
            return (this.formatOptions || []).reduce(function (opts, name) {
                if (obj.hasOwnProperty(name)) {
                    opts[name] = obj[name];
                }

                return opts;
            }, {});
        }
    },

    propsTypes       : typesSpec,
    contextTypes     : typesSpec,
    childContextTypes: typesSpec,

    getNumberFormat  : createFormatCache(Intl.NumberFormat),
    getDateTimeFormat: createFormatCache(Intl.DateTimeFormat),
    getMessageFormat : createFormatCache(IntlMessageFormat),
    getRelativeFormat: createFormatCache(IntlRelativeFormat),

    getChildContext: function () {
        var context = this.context;
        var props   = this.props;

        return {
            locales:  props.locales  || context.locales,
            formats:  props.formats  || context.formats,
            messages: props.messages || context.messages
        };
    },

    formatDate: function (date, options) {
        date = new Date(date);
        assertIsDate(date, 'A date or timestamp must be provided to formatDate()');
        return this._format('date', date, options);
    },

    formatTime: function (date, options) {
        date = new Date(date);
        assertIsDate(date, 'A date or timestamp must be provided to formatTime()');
        return this._format('time', date, options);
    },

    formatRelative: function (date, options) {
        date = new Date(date);
        assertIsDate(date, 'A date or timestamp must be provided to formatRelative()');
        return this._format('relative', date, options);
    },

    formatNumber: function (num, options) {
        assertIsNumber(num, 'A number must be provided to formatNumber()');
        return this._format('number', num, options);
    },

    formatMessage: function (message, values) {
        var locales = this.props.locales || this.context.locales;
        var formats = this.props.formats || this.context.formats;

        // When `message` is a function, assume it's an IntlMessageFormat
        // instance's `format()` method passed by reference, and call it. This
        // is possible because its `this` will be pre-bound to the instance.
        if (typeof message === 'function') {
            return message(values);
        }

        if (typeof message === 'string') {
            message = this.getMessageFormat(message, locales, formats);
        }

        return message.format(values);
    },

    getIntlMessage: function (path) {
        var messages  = this.props.messages || this.context.messages;
        var pathParts = path.split('.');

        var message;

        try {
            message = pathParts.reduce(function (obj, pathPart) {
                return obj[pathPart];
            }, messages);
        } finally {
            if (message === undefined) {
                throw new ReferenceError('Could not find Intl message: ' + path);
            }
        }

        return message;
    },

    _format: function (type, value, options) {
        var locales = this.props.locales || this.context.locales;
        var formats = this.props.formats || this.context.formats;

        if (options && typeof options === 'string') {
            try {
                options = formats[type][options];
            } catch (e) {
                options = undefined;
            } finally {
                if (options === undefined) {
                    throw new ReferenceError(
                        'No ' + type + ' format named: ' + options
                    );
                }
            }
        }

        switch(type) {
            case 'date':
            case 'time':
                return this.getDateTimeFormat(locales, options).format(value);
            case 'number':
                return this.getNumberFormat(locales, options).format(value);
            case 'relative':
                return this.getRelativeFormat(locales, options).format(value);
            default:
                throw new Error('Unrecognized format type: ' + type);
        }
    }
};
