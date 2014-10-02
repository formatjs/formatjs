/* global React */
/* jslint esnext:true */

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

export default {
    propsTypes       : typesSpec,
    contextTypes     : typesSpec,
    childContextTypes: typesSpec,

    getNumberFormat  : createFormatCache(Intl.NumberFormat),
    getDateTimeFormat: createFormatCache(Intl.DateTimeFormat),
    getMessageFormat : createFormatCache(IntlMessageFormat),
    getRelativeFormat: createFormatCache(IntlRelativeFormat),

    getChildContext: function () {
        var childContext = {
            locales: this.context.locales,
            formats: this.context.formats,
            messages: this.context.messages
        };

        if (this.props.locales) {
            childContext.locales = this.props.locales;
        }

        if (this.props.formats) {
            childContext.formats = this.props.formats;
        }

        if (this.props.messages) {
            childContext.messages = this.props.messages;
        }

        return childContext;
    },

    formatDate: function (date, options) {
        var locales = this.props.locales || this.context.locales,
            formats = this.props.formats || this.context.formats;

        date = new Date(date);

        // Determine if the `date` is valid.
        if (!(date && date.getTime())) {
            throw new TypeError('A date must be provided.');
        }

        if (options && typeof options === 'string') {
            try {
                options = formats.date[options];
            } catch (e) {
                throw new ReferenceError('No date format named: ' + options);
            }
        }

        return this.getDateTimeFormat(locales, options).format(date);
    },

    formatTime: function (date, options) {
        var formats = this.props.formats || this.context.formats;

        // Lookup named format on `formats.time` before delegating to
        // `formatDate()`.
        if (options && typeof options === 'string') {
            try {
                options = formats.time[options];
            } catch (e) {
                throw new ReferenceError('No time format named: ' + options);
            }
        }

        return this.formatDate(date, options);
    },

    formatNumber: function (num, options) {
        var locales = this.props.locales || this.context.locales,
            formats = this.props.formats || this.context.formats;

        if (typeof num !== 'number') {
            throw new TypeError('A number must be provided.');
        }

        if (options && typeof options === 'string') {
            try {
                options = formats.number[options];
            } catch (e) {
                throw new ReferenceError('No number format named: ' + options);
            }
        }

        return this.getNumberFormat(locales, options).format(num);
    },

    formatMessage: function (message, values) {
        var locales = this.props.locales || this.context.locales,
            formats = this.props.formats || this.context.formats;

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

    formatRelative: function (date, options) {
        var locales = this.props.locales || this.context.locales,
            formats = this.props.formats || this.context.formats;

        date = new Date(date);

        // Determine if the `date` is valid.
        if (!(date && date.getTime())) {
            throw new TypeError('A date must be provided.');
        }

        if (options && typeof options === 'string') {
            try {
                options = formats.relative[options];
            } catch (e) {
                throw new ReferenceError('No relative format named: ' + options);
            }
        }

        return this.getRelativeFormat(locales, options).format(date);
    },

    getIntlMessage: function (path) {
        var messages  = this.props.messages || this.context.messages,
            pathParts = path.split('.');

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

    __addLocaleData: function (data) {
        IntlMessageFormat.__addLocaleData(data);
        IntlRelativeFormat.__addLocaleData(data);
    }
};
