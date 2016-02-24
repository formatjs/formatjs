/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

var p = require('path');

var getParentLocale = require('./locales').getParentLocale;
var hasDateFields   = require('./locales').hasDateFields;
var normalizeLocale = require('./locales').normalizeLocale;

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
    // The CLDR states that the "root" locale's data should be used to fill in
    // any missing data as its data is the default.
    var defaultFields = loadRelativeFields('root');

    var fields = {};
    var hashes = {};

    // Loads and caches the relative fields for a given `locale` because loading
    // and transforming the data is expensive.
    function getRelativeFields(locale) {
        var relativeFields = fields[locale];
        if (relativeFields) {
            return relativeFields;
        }

        if (hasDateFields(locale)) {
            relativeFields = fields[locale] = loadRelativeFields(locale);
            return relativeFields;
        }
    }

    // Hashes and caches the `fields` for a given `locale` to avoid hashing more
    // than once since it could be expensive.
    function hashFields(locale, fields) {
        var hash = hashes[locale];
        if (hash) {
            return hash;
        }

        hash = hashes[locale] = JSON.stringify(fields);
        return hash;
    }

    // We want to de-dup data that can be referenced from upstream in the
    // `locale`'s hierarchy when that locale's relative fields are the _exact_
    // same as one of its ancestors. This will traverse the hierarchy for the
    // given `locale` until it finds an ancestor with same same relative fields.
    // When an ancestor can't be found, a data entry must be created for the
    // `locale` since its relative fields are unique.
    function findGreatestAncestor(locale) {
        // The "root" locale is not a suitable ancestor, because there won't be
        // an entry for "root" in the final data object.
        var parentLocale = getParentLocale(locale);
        if (!parentLocale || parentLocale === 'root') {
            return locale;
        }

        // When the `locale` doesn't have fields data, we need to traverse up
        // its hierarchy to find suitable relative fields data.
        if (!hasDateFields(locale)) {
            return findGreatestAncestor(parentLocale);
        }

        var fields;
        var parentFields;
        if (hasDateFields(parentLocale)) {
            fields       = getRelativeFields(locale);
            parentFields = getRelativeFields(parentLocale);

            // We can only use this ancestor's fields if they hash to the
            // _exact_ same value as `locale`'s fields. If the ancestor is
            // suitable, we keep looking up its hierarchy until the relative
            // fields are determined to be unique.
            if (hashFields(locale, fields) ===
                hashFields(parentLocale, parentFields)) {

                return findGreatestAncestor(parentLocale);
            }
        }

        return locale;
    }

    return locales.reduce(function (relativeFields, locale) {
        // Walk the `locale`'s hierarchy to look for suitable ancestor with the
        // _exact_ same relative fields. If no ancestor is found, the given
        // `locale` will be returned.
        locale = findGreatestAncestor(normalizeLocale(locale));

        // The "root" locale is ignored because the built-in `Intl` libraries in
        // JavaScript have no notion of a "root" locale; instead they use the
        // IANA Language Subtag Registry.
        if (locale === 'root') {
            return relativeFields;
        }

        // Add an entry for the `locale`, which might be an ancestor. If the
        // locale doesn't have relative fields, then we fallback to the "root"
        // locale's fields.
        relativeFields[locale] = {
            fields: getRelativeFields(locale) || defaultFields,
        };

        return relativeFields;
    }, {});
};

function loadRelativeFields(locale) {
    var filename = p.join('cldr-dates-full', 'main', locale, 'dateFields.json');
    var fields   = require(filename).main[locale].dates.fields;

    // Reduce the date fields data down to whitelist of fields needed in the
    // FormatJS libs.
    return FIELD_NAMES.reduce(function (relative, field) {
        // Transform the fields data from the CLDR structure to one that's
        // easier to override and customize (if needed). This is also required
        // back-compat in v1.x of the FormatJS libs.
        relative[field] = transformFieldData(fields[field]);
        return relative;
    }, {});
}

// Transforms the CLDR's data structure for the relative fields into a structure
// that's more concise and easier to override to supply custom data.
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
