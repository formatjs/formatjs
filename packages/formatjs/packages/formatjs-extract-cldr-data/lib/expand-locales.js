/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

var glob = require('glob');
var path = require('path');

var availableLocales = require('./locales').locales;

// Language tags have a hierarchical meaning which this function uses to expand
// the specificed `locales` up to their root locales and returns a collection of
// unique language tags.
module.exports = function expandLocales(locales) {
    if (!locales) {
        return availableLocales.toArray();
    }

    if (!Array.isArray(locales)) {
        throw new Error('locales must be an array of strings');
    }

    var hash = locales.reduce(function (hash, locale) {
        if (typeof locale !== 'string') {
            throw new Error('locales must be an array of strings');
        }

        var parts = locale.split('-');
        while (parts.length) {
            locale = normalizeLocale(parts.join('-'));
            hash[locale] = true;
            parts.pop();
        }

        return hash;
    }, {});

    return Object.keys(hash);
};

function normalizeLocale(locale) {
    var normalizedLocale = availableLocales.normalize(locale);
    if (normalizedLocale) {
        return normalizedLocale;
    }

    throw new Error('No locale data for: "' + locale + '"');
}
