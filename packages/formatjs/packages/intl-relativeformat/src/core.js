/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */

import {defineProperty, objCreate, fnBind} from './es5';
import IntlMessageFormat from "intl-messageformat";
import diff from './diff';

export default RelativeFormat;

// default relative time thresholds from moment.js to align with it
var thresholds = {
    second: 45,  // seconds to minute
    minute: 45,  // minutes to hour
    hour: 22,  // hours to day
    day: 26,  // days to month
    month: 11   // months to year
};

var priority = ['second', 'minute', 'hour', 'day', 'month', 'year'];

// -- RelativeFormat --------------------------------------------------------

function RelativeFormat(locales, options) {
    defineProperty(this, '_locale',  {value: this._resolveLocale(locales)});
    defineProperty(this, '_options', {value: options || {}});
    defineProperty(this, '_messages', {value: objCreate(null)});

    // Bind `format()` method to `this` so it can be passed by reference like
    // the other `Intl` APIs.
    this.format = fnBind.call(this.format, this);
}

// Define internal private properties for dealing with locale data.
defineProperty(RelativeFormat, '__availableLocales__', {value: []});
defineProperty(RelativeFormat, '__localeData__', {value: objCreate(null)});
defineProperty(RelativeFormat, '__addLocaleData', {value: function (data) {
    if (!(data && data.locale)) {
        throw new Error('Object passed does not identify itself with a valid language tag');
    }

    if (!data.relativeTime) {
        throw new Error('Object passed does not contain locale data for IntlRelativeFormat');
    }

    var availableLocales = RelativeFormat.__availableLocales__,
        localeData       = RelativeFormat.__localeData__;

    // Message format locale data only requires the first part of the tag.
    var locale = data.locale.toLowerCase().split('-')[0];

    availableLocales.push(locale);
    localeData[locale] = data.relativeTime;
}});

// Define public `defaultLocale` property which can be set by the developer, or
// it will be set when the first RelativeFormat instance is created by leveraging
// the resolved locale from `Intl`.
defineProperty(RelativeFormat, 'defaultLocale', {
    enumerable: true,
    writable  : true,
    value     : undefined
});

defineProperty(RelativeFormat, '__getDefaultLocale', {value: function () {
    if (!RelativeFormat.defaultLocale) {
        // Leverage the locale-resolving capabilities of `Intl` to determine
        // what the default locale should be.
        RelativeFormat.defaultLocale =
                new Intl.NumberFormat().resolvedOptions().locale;
    }

    return RelativeFormat.defaultLocale;
}});

RelativeFormat.prototype.format = function (date) {
    date = new Date(date);

    // Determine if the `date` is valid.
    if (!(date && date.getTime())) {
        throw new TypeError('A date must be provided.');
    }

    var d = diff(new Date(), date),
        key, msg, i, l;

    for (i = 0, l = priority.length; i < l; i++) {
        key = priority[i];
        if (d[key] < thresholds[key]) {
            break;
        }
    }

    msg = this._resolveMessage(key);
    return msg.format({
        0: d[key],
        when: d.duration < 0 ? 'past' : 'future'
    });
};

RelativeFormat.prototype.resolvedOptions = function () {
    // TODO: Provide anything else?
    return {
        locale: this._locale
    };
};

RelativeFormat.prototype._resolveMessage = function (key) {
    var messages = this._messages,
        data, i, future = '', past = '';

    if (!messages[key]) {
        // creating a new synthetic message based on the locale data from CLDR
        data = RelativeFormat.__localeData__[this._locale];
        for (i in data[key].future) {
            if (data[key].future.hasOwnProperty(i)) {
                future += ' ' + i + ' {' + data[key].future[i] + '}';
            }
        }
        for (i in data[key].past) {
            if (data[key].past.hasOwnProperty(i)) {
                past += ' ' + i + ' {' + data[key].past[i] + '}';
            }
        }
        messages[key] = new IntlMessageFormat(
            '{when, select, future {{0, plural, ' + future + '}} past {{0, plural, ' + past   + '}}}',
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

    return locale || RelativeFormat.__getDefaultLocale().split('-')[0];
};
