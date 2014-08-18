/* global React */
/* jslint esnext:true */

import {
    getDateTimeFormat,
    getNumberFormat,
    getMessageFormat
} from 'intl-format-cache';

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

    getChildContext: function () {
        var childContext = Object.create(this.context);

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

        return getDateTimeFormat(locales, options).format(date);
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

        return getNumberFormat(locales, options).format(num);
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
            message = getMessageFormat(message, locales, formats);
        }

        return message.format(values);
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
    }
};
