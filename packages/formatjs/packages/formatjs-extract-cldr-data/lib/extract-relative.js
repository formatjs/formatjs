/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

var fs   = require('fs');
var glob = require('glob');
var path = require('path');

var availableLocales = require('./locales').localesWithDateFields;

var CLDR_PATH = path.resolve(__dirname, '..', 'data');

// The set of CLDR date field names that are used in FormatJS.
var FIELD_NAMES = [
    'year',
    'month',
    'day',
    'hour',
    'minute',
    'second',
];

module.exports = function extractRelativeFields(locales) {
    var data   = loadRelativeFieldsData(locales);
    var hashes = {};

    function hashFields(locale, fields) {
        if (hashes[locale]) {
            return hashes[locale];
        }

        return (hashes[locale] = JSON.stringify(fields));
    }

    // To produce a collection of locales and their data that's unique, the fact
    // that langauge tags are hierarchical is used to determine if the current
    // locale's field data is represented by another, more generic, locale
    // within its hierarchy.
    return Object.keys(data).reduce(function (relativeFields, locale) {
        var fields = data[locale];
        var parts  = locale.split('-');
        var parentLocale;
        var hash;

        // Walk up the locale hierarchy to determine if the current locale's
        // field data is already represented by one of its parent locales.
        while (parts.length > 1) {
            // Remove the last segment of the language tag.
            parts.pop();

            parentLocale = parts.join('-');
            hash         = hashFields(locale, fields);

            // No-ops if the field data already exists in the hierarchy.
            if (data[parentLocale] &&
                    hash === hashFields(parentLocale, data[parentLocale])) {
                return relativeFields;
            }
        }

        relativeFields[locale] = {
            fields: fields,
        };

        return relativeFields;
    }, {});
};

function loadRelativeFieldsData(locales) {
    return locales.filter(function (locale) {
        return availableLocales.has(locale);
    }).reduce(function (data, locale) {
        var filename = path.join(CLDR_PATH, 'main', locale, 'dateFields.json');
        var fields   = require(filename).main[locale].dates.fields;

        // Reduce the date fields data down to whitelist of fields needed in the
        // FormatJS libs.
        data[locale] = FIELD_NAMES.reduce(function (relative, field) {
            // Transform the fields data from the CLDR structure to one that's
            // easier to override and customize (if needed). This is also
            // required back-compat in v1.x of the FormatJS libs.
            relative[field] = transformFieldData(fields[field]);
            return relative;
        }, {});

        return data;
    }, {});
}

function transformFieldData(data) {
    Object.keys(data).forEach(function (key) {
        var type = key.match(/^(relative|relativeTime)-type-(.+)$/) || [];

        switch (type[1]) {
            case 'relative':
                data.relative || (data.relative = {});
                data.relative[type[2]] = data[key];
                delete data[key];
                return;

            case 'relativeTime':
                data.relativeTime || (data.relativeTime = {});
                data.relativeTime[type[2]] = Object.keys(data[key])
                    .reduce(function (counts, count) {
                        var k = count.replace('relativeTimePattern-count-', '');
                        counts[k] = data[key][count];
                        return counts;
                    }, {});
                delete data[key];
                return;
        }
    });

    return data;
}
