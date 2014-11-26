/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */

import {defineProperty, objCreate, arrIndexOf} from './es5';
import IntlMessageFormat from 'intl-messageformat';
import diff from './diff';

export default RelativeFormat;

// -----------------------------------------------------------------------------

var FIELDS = ['second', 'minute', 'hour', 'day', 'month', 'year'];
var STYLES = ['best fit', 'numeric'];

var getTime = Date.now ? Date.now : function () {
    return new Date().getTime();
};

// -- RelativeFormat -----------------------------------------------------------

function RelativeFormat(locales, options) {
    options = options || {};

    // Make a copy of `locales` if it's an array, so that it doesn't change
    // since it's used lazily.
    if (Object.prototype.toString.call(locales) === '[object Array]') {
        locales = locales.concat();
    }

    defineProperty(this, '_locale', {value: this._resolveLocale(locales)});
    defineProperty(this, '_locales', {value: locales});
    defineProperty(this, '_options', {value: {
        style: this._resolveStyle(options.style),
        units: this._isValidUnits(options.units) && options.units
    }});

    defineProperty(this, '_messages', {value: objCreate(null)});

    // "Bind" `format()` method to `this` so it can be passed by reference like
    // the other `Intl` APIs.
    var relativeFormat = this;
    this.format = function format(date) {
        return relativeFormat._format(date);
    };
}

// Define internal private properties for dealing with locale data.
defineProperty(RelativeFormat, '__localeData__', {value: objCreate(null)});
defineProperty(RelativeFormat, '__addLocaleData', {value: function (data) {
    if (!(data && data.locale)) {
        throw new Error(
            'Locale data provided to IntlRelativeFormat is missing a ' +
            '`locale` property value'
        );
    }

    if (!data.fields) {
        throw new Error(
            'Locale data provided to IntlRelativeFormat is missing a ' +
            '`fields` property value'
        );
    }

    // Add data to IntlMessageFormat.
    IntlMessageFormat.__addLocaleData(data);

    // Relative format locale data only requires the first part of the tag.
    var locale = data.locale.toLowerCase().split('-')[0];

    RelativeFormat.__localeData__[locale] = data;
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
    return {
        locale: this._locale,
        style : this._options.style,
        units : this._options.units
    };
};

RelativeFormat.prototype._compileMessage = function (units) {
    // `this._locales` is the original set of locales the user specificed to the
    // constructor, while `this._locale` is the resolved root locale.
    var locales        = this._locales;
    var resolvedLocale = this._locale;

    var localeData   = RelativeFormat.__localeData__;
    var field        = localeData[resolvedLocale].fields[units];
    var relativeTime = field.relativeTime;
    var future       = '';
    var past         = '';
    var i;

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

    var message = '{when, select, future {{0, plural, ' + future + '}}' +
                                 'past {{0, plural, ' + past + '}}}';

    // Create the synthetic IntlMessageFormat instance using the original
    // locales value specified by the user when constructing the the parent
    // IntlRelativeFormat instance.
    return new IntlMessageFormat(message, locales);
};

RelativeFormat.prototype._format = function (date) {
    var now = getTime();

    if (date === undefined) {
        date = now;
    }

    // Determine if the `date` is valid, and throw a similar error to what
    // `Intl.DateTimeFormat#format()` would throw.
    if (!isFinite(date)) {
        throw new RangeError(
            'The date value provided to IntlRelativeFormat#format() is not ' +
            'in valid range.'
        );
    }

    var diffReport  = diff(now, date);
    var units       = this._options.units || this._selectUnits(diffReport);
    var diffInUnits = diffReport[units];

    if (this._options.style !== 'numeric') {
        var relativeUnits = this._resolveRelativeUnits(diffInUnits, units);
        if (relativeUnits) {
            return relativeUnits;
        }
    }

    return this._resolveMessage(units).format({
        '0' : Math.abs(diffInUnits),
        when: diffInUnits < 0 ? 'past' : 'future'
    });
};

RelativeFormat.prototype._isValidUnits = function (units) {
    if (!units || arrIndexOf.call(FIELDS, units) >= 0) {
        return true;
    }

    if (typeof units === 'string') {
        var suggestion = /s$/.test(units) && units.substr(0, units.length - 1);
        if (suggestion && arrIndexOf.call(FIELDS, suggestion) >= 0) {
            throw new Error(
                '"' + units + '" is not a valid IntlRelativeFormat `units` ' +
                'value, did you mean: ' + suggestion
            );
        }
    }

    throw new Error(
        '"' + units + '" is not a valid IntlRelativeFormat `units` value, it ' +
        'must be one of: "' + FIELDS.join('", "') + '"'
    );
};

RelativeFormat.prototype._resolveLocale = function (locales) {
    if (!locales) {
        locales = RelativeFormat.defaultLocale;
    }

    if (typeof locales === 'string') {
        locales = [locales];
    }

    var hop        = Object.prototype.hasOwnProperty;
    var localeData = RelativeFormat.__localeData__;
    var i, len, locale;

    for (i = 0, len = locales.length; i < len; i += 1) {
        // We just need the root part of the langage tag.
        locale = locales[i].split('-')[0].toLowerCase();

        // Validate that the langage tag is structurally valid.
        if (!/[a-z]{2,3}/.test(locale)) {
            throw new Error(
                'Language tag provided to IntlRelativeFormat is not ' +
                'structrually valid: ' + locale
            );
        }

        // Return the first locale for which we have CLDR data registered.
        if (hop.call(localeData, locale)) {
            return locale;
        }
    }

    throw new Error(
        'No locale data has been added to IntlRelativeFormat for: ' +
        locales.join(', ')
    );
};

RelativeFormat.prototype._resolveMessage = function (units) {
    var messages = this._messages;

    // Create a new synthetic message based on the locale data from CLDR.
    if (!messages[units]) {
        messages[units] = this._compileMessage(units);
    }

    return messages[units];
};

RelativeFormat.prototype._resolveRelativeUnits = function (diff, units) {
    var field = RelativeFormat.__localeData__[this._locale].fields[units];

    if (field.relative) {
        return field.relative[diff];
    }
};

RelativeFormat.prototype._resolveStyle = function (style) {
    // Default to "best fit" style.
    if (!style) {
        return STYLES[0];
    }

    if (arrIndexOf.call(STYLES, style) >= 0) {
        return style;
    }

    throw new Error(
        '"' + style + '" is not a valid IntlRelativeFormat `style` value, it ' +
        'must be one of: "' + STYLES.join('", "') + '"'
    );
};

RelativeFormat.prototype._selectUnits = function (diffReport) {
    var i, l, units;

    for (i = 0, l = FIELDS.length; i < l; i += 1) {
        units = FIELDS[i];

        if (Math.abs(diffReport[units]) < RelativeFormat.thresholds[units]) {
            break;
        }
    }

    return units;
};
