/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

var glob = require('glob');
var path = require('path');

exports.getAllLocales   = getAllLocales;
exports.getParentLocale = getParentLocale;
exports.hasDateFields   = hasDateFields;
exports.hasPluralRule   = hasPluralRule;
exports.normalizeLocale = normalizeLocale;

// These are the exceptions to the default algorithm for determining a locale's
// parent locale.
var PARENT_LOCALES_HASH = require('../data/supplemental/parentLocales.json')
    .supplemental.parentLocales.parentLocale;

var PLURAL_LOCALES_HASH = require('../data/supplemental/plurals.json')
    .supplemental['plurals-type-cardinal'];

var DATE_FIELDS_LOCALES_HASH = glob.sync('*/dateFields.json', {
    cwd: path.resolve(__dirname, '..', 'data', 'main'),
}).reduce(function (hash, filename) {
    hash[path.dirname(filename)] = true;
    return hash;
}, {});

// Some locales that have a `pluralRuleFunction` don't have a `dateFields.json`
// file, and visa versa, so this creates a unique collection of all locales in
// the CLDR for which we need data from.
var ALL_LOCALES_HASH =
    Object.keys(PARENT_LOCALES_HASH)
    .concat(Object.keys(PLURAL_LOCALES_HASH))
    .concat(Object.keys(DATE_FIELDS_LOCALES_HASH))
    .sort()
    .reduce(function (hash, locale) {
        hash[locale.toLowerCase()] = locale;
        return hash;
    }, {});

function getAllLocales() {
    return Object.keys(ALL_LOCALES_HASH);
}

function getParentLocale(locale) {
    locale = normalizeLocale(locale);

    // If we don't know about the locale, or if it's the "root" locale, then its
    // parent should be `undefined`.
    if (!locale || locale === 'root') {
        return;
    }

    // First check the exceptions for locales which don't follow the standard
    // hierarchical pattern.
    var parentLocale = PARENT_LOCALES_HASH[locale];
    if (parentLocale) {
        return parentLocale;
    }

    // Be default, the language tags are hierarchal, therefore we can identify
    // the parent locale by simply popping off the last segment.
    var localeParts = locale.split('-');
    if (localeParts.length > 1) {
        localeParts.pop();
        return localeParts.join('-');
    }

    // When there's nothing left in the hierarchy, the parent is the "root".
    return 'root';
}

function hasDateFields(locale) {
    return DATE_FIELDS_LOCALES_HASH.hasOwnProperty(normalizeLocale(locale));
}

function hasPluralRule(locale) {
    return PLURAL_LOCALES_HASH.hasOwnProperty(normalizeLocale(locale));
}

function normalizeLocale(locale) {
    var normalizedLocale = ALL_LOCALES_HASH[locale.toLowerCase()];
    if (normalizedLocale) {
        return normalizedLocale;
    }

    throw new Error('No locale data for: "' + locale + '"');
}
