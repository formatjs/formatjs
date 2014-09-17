/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */

import {defineProperty, objCreate} from './es5';
import IntlMessageFormat from 'intl-messageformat';
import diff from './diff';

export default RelativeFormat;

var priority = ['second', 'minute', 'hour', 'day', 'month', 'year'];

// -- RelativeFormat --------------------------------------------------------

function RelativeFormat(locales, options) {
    defineProperty(this, '_locale', {value: this._resolveLocale(locales)});
    defineProperty(this, '_messages', {value: objCreate(null)});

    // "Bind" `format()` method to `this` so it can be passed by reference like
    // the other `Intl` APIs.
    var relativeFormat = this;
    this.format = function (date) {
        return relativeFormat._format(date);
    };
}

// Define internal private properties for dealing with locale data.
defineProperty(RelativeFormat, '__availableLocales__', {value: []});
defineProperty(RelativeFormat, '__localeData__', {value: objCreate(null)});
defineProperty(RelativeFormat, '__addLocaleData', {value: function (data) {
    if (!(data && data.locale)) {
        throw new Error('Locale data does not contain a `locale` property');
    }

    if (!data.fields) {
        throw new Error('Locale data does not contain a `fields` property');
    }

    // Add data to IntlMessageFormat.
    IntlMessageFormat.__addLocaleData(data);

    var availableLocales = RelativeFormat.__availableLocales__,
        localeData       = RelativeFormat.__localeData__;

    // Message format locale data only requires the first part of the tag.
    var locale = data.locale.toLowerCase().split('-')[0];

    availableLocales.push(locale);
    localeData[locale] = data;
}});

// Define public `defaultLocale` property which can be set by the developer, or
// it will be set when the first RelativeFormat instance is created by leveraging
// the resolved locale from `Intl`.
defineProperty(RelativeFormat, 'defaultLocale', {
    enumerable: true,
    writable  : true,
    value     : undefined
});

// Define public `thresholds` property which can be set by the developer, and
// defaults to relative time thresholds from moment.js.
defineProperty(RelativeFormat, 'thresholds', {
    enumerable: true,

    value: {
        second: 45,  // seconds to minute
        minute: 45,  // minutes to hour
        hour  : 22,  // hours to day
        day   : 26,  // days to month
        month : 11   // months to year
    }
});

RelativeFormat.prototype.resolvedOptions = function () {
    // TODO: Provide anything else?
    return {
        locale: this._locale
    };
};

RelativeFormat.prototype._format = function (date) {
    date = new Date(date);

    // Determine if the `date` is valid.
    if (!(date && date.getTime())) {
        throw new TypeError('A date must be provided.');
    }

    var d = diff(new Date(), date),
        key, msg, i, l;

    for (i = 0, l = priority.length; i < l; i++) {
        key = priority[i];
        if (d[key] < RelativeFormat.thresholds[key]) {
            break;
        }
    }

    msg = this._resolveMessage(key);

    return msg.format({
        '0' : d[key],
        when: d.duration < 0 ? 'past' : 'future'
    });
};

RelativeFormat.prototype._resolveMessage = function (key) {
    var messages = this._messages,
        field, relativeTime, i, future, past;

    // Create a new synthetic message based on the locale data from CLDR.
    if (!messages[key]) {
        field        = RelativeFormat.__localeData__[this._locale].fields[key];
        relativeTime = field.relativeTime;
        future       = '';
        past         = '';

        for (i in relativeTime.future) {
            if (relativeTime.future.hasOwnProperty(i)) {
                future += ' ' + i + ' {' +
                    relativeTime.future[i].replace('{0}', '#') + '}';
            }
        }
        for (i in relativeTime.past) {
            if (relativeTime.past.hasOwnProperty(i)) {
                past += ' ' + i + ' {' +
                    relativeTime.past[i].replace('{0}', '#') + '}';
            }
        }

        messages[key] = new IntlMessageFormat(
            '{when, select, future {{0, plural, ' + future + '}}' +
                           'past {{0, plural, ' + past + '}}}',
            this._locale
        );
    }

    return messages[key];
};

RelativeFormat.prototype._resolveLocale = function (locales) {
    var availableLocales = RelativeFormat.__availableLocales__,
        locale, parts, i, len;

    if (availableLocales.length === 0) {
        throw new Error('No locale data has been provided for IntlRelativeFormat yet');
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

    return locale || RelativeFormat.defaultLocale.split('-')[0];
};
