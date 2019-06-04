(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.IntlRelativeFormat = factory());
}(this, function () { 'use strict';

    /*
    Copyright (c) 2014, Yahoo! Inc. All rights reserved.
    Copyrights licensed under the New BSD License.
    See the accompanying LICENSE file for terms.
    */
    function daysToYears(days) {
        // 400 years have 146097 days (taking into account leap year rules)
        return (days * 400) / 146097;
    }
    // Thanks to date-fns
    // https://github.com/date-fns/date-fns
    // MIT © Sasha Koss
    var MILLISECONDS_IN_MINUTE = 60000;
    var MILLISECONDS_IN_DAY = 86400000;
    function startOfDay(dirtyDate) {
        var date = new Date(dirtyDate);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    function differenceInCalendarDays(dirtyDateLeft, dirtyDateRight) {
        var startOfDayLeft = startOfDay(dirtyDateLeft);
        var startOfDayRight = startOfDay(dirtyDateRight);
        var timestampLeft = startOfDayLeft.getTime() -
            startOfDayLeft.getTimezoneOffset() * MILLISECONDS_IN_MINUTE;
        var timestampRight = startOfDayRight.getTime() -
            startOfDayRight.getTimezoneOffset() * MILLISECONDS_IN_MINUTE;
        // Round the number of days to the nearest integer
        // because the number of milliseconds in a day is not constant
        // (e.g. it's different in the day of the daylight saving time clock shift)
        return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_DAY);
    }
    function diff(from, to) {
        // Convert to ms timestamps.
        from = +from;
        to = +to;
        var millisecond = Math.round(to - from), second = Math.round(millisecond / 1000), minute = Math.round(second / 60), hour = Math.round(minute / 60);
        // We expect a more precision in rounding when dealing with
        // days as it feels wrong when something happended 13 hours ago and
        // is regarded as "yesterday" even if the time was this morning.
        var day = differenceInCalendarDays(to, from);
        var week = Math.round(day / 7);
        var rawYears = daysToYears(day), month = Math.round(rawYears * 12), year = Math.round(rawYears);
        return {
            second: second,
            'second-short': second,
            'second-narrow': second,
            minute: minute,
            'minute-short': minute,
            'minute-narrow': minute,
            hour: hour,
            'hour-short': hour,
            'hour-narrow': hour,
            day: day,
            'day-short': day,
            'day-narrow': day,
            week: week,
            'week-short': week,
            'week-narrow': week,
            month: month,
            'month-short': month,
            'month-narrow': month,
            year: year,
            'year-short': year,
            'year-narrow': year
        };
    }

    /*
    Copyright (c) 2014, Yahoo! Inc. All rights reserved.
    Copyrights licensed under the New BSD License.
    See the accompanying LICENSE file for terms.
    */
    // -----------------------------------------------------------------------------
    var SUPPORTED_FIELDS = [
        "second" /* second */,
        "second-short" /* secondShort */,
        "minute" /* minute */,
        "minute-short" /* minuteShort */,
        "hour" /* hour */,
        "hour-short" /* hourShort */,
        "day" /* day */,
        "day-short" /* dayShort */,
        "month" /* month */,
        "month-short" /* monthShort */,
        "year" /* year */,
        "year-short" /* yearShort */
    ];
    function isValidUnits(units) {
        if (!units || ~SUPPORTED_FIELDS.indexOf(units)) {
            return true;
        }
        if (typeof units === 'string') {
            var suggestion = /s$/.test(units) && units.substr(0, units.length - 1);
            if (suggestion &&
                ~SUPPORTED_FIELDS.indexOf(suggestion)) {
                throw new Error("\"" + units + "\" is not a valid IntlRelativeFormat 'units' value, did you mean: " + suggestion);
            }
        }
        throw new Error("\"" + units + "\" is not a valid IntlRelativeFormat 'units' value, it must be one of: " + SUPPORTED_FIELDS.join('", "'));
    }
    function resolveStyle(style) {
        // Default to "best fit" style.
        if (!style) {
            return "best fit" /* bestFit */;
        }
        if (style === 'best fit' || style === 'numeric') {
            return style;
        }
        throw new Error("\"" + style + "\" is not a valid IntlRelativeFormat 'style' value, it must be one of: 'best fit' or 'numeric'");
    }
    function selectUnits(diffReport) {
        var fields = SUPPORTED_FIELDS.filter(function (field) {
            return field.indexOf('-short') < 1;
        });
        var units = fields[0];
        for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
            units = fields_1[_i];
            if (Math.abs(diffReport[units]) < RelativeFormat.thresholds[units]) {
                break;
            }
        }
        return units;
    }
    var RelativeFormat = (function (locales, options) {
        if (options === void 0) { options = {}; }
        var resolvedOptions = {
            style: resolveStyle(options.style),
            units: isValidUnits(options.units) && options.units
        };
        var numeric = resolvedOptions.style === 'best fit' ? 'auto' : 'always';
        var rtf = new Intl.RelativeTimeFormat(locales, {
            numeric: numeric
        });
        return {
            format: function (date, options) {
                var now = options && options.now !== undefined
                    ? options.now === null
                        ? 0
                        : options.now
                    : Date.now();
                if (date === undefined) {
                    date = now;
                }
                // Determine if the `date` and optional `now` values are valid, and throw a
                // similar error to what `Intl.DateTimeFormat#format()` would throw.
                if (!isFinite(now)) {
                    throw new RangeError('The `now` option provided to IntlRelativeFormat#format() is not ' +
                        'in valid range.');
                }
                if (!isFinite(date)) {
                    throw new RangeError('The date value provided to IntlRelativeFormat#format() is not ' +
                        'in valid range.');
                }
                var diffReport = diff(now, date);
                var units = resolvedOptions.units || selectUnits(diffReport);
                var diffInUnits = diffReport[units];
                var style = units.substring(units.length - 6, units.length) === '-short'
                    ? 'narrow'
                    : 'long';
                var rtfUnit = units.replace('-short', '');
                return new Intl.RelativeTimeFormat(locales, {
                    numeric: numeric,
                    style: style
                }).format(diffInUnits, rtfUnit);
            },
            resolvedOptions: function () {
                return {
                    locale: rtf.resolvedOptions().locale,
                    style: resolvedOptions.style,
                    units: resolvedOptions.units
                };
            }
        };
    });
    // Define public `defaultLocale` property which can be set by the developer, or
    // it will be set when the first RelativeFormat instance is created by
    // leveraging the resolved locale from `Intl`.
    RelativeFormat.defaultLocale = 'en';
    RelativeFormat.thresholds = {
        second: 45,
        'second-short': 45,
        minute: 45,
        'minute-short': 45,
        hour: 22,
        'hour-short': 22,
        day: 26,
        'day-short': 26,
        month: 11,
        'month-short': 11 // months to year
    };

    return RelativeFormat;

}));
//# sourceMappingURL=intl-relativeformat.js.map
