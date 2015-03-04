/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

var getParentLocale = require('./locales').getParentLocale;
var normalizeLocale = require('./locales').normalizeLocale;

// Language tags have a hierarchical meaning which this function uses to expand
// the specified `locales` up to their root locales. This returns a collection
// of objects with a `locale` property and `parentLocale` property pointing to
// the locale's parent language tag, if it has one.
module.exports = function expandLocales(locales) {
    if (!Array.isArray(locales)) {
        throw new Error('locales must be an array of strings');
    }

    // Traverses the specified `locales` and adds an entry for each one and its
    // hierarchy.
    return locales.reduce(function (locales, locale) {
        if (typeof locale !== 'string') {
            throw new Error('locales must be an array of strings');
        }

        locale = normalizeLocale(locale);

        var parentLocale;
        var entry;

        // Creates an entry for each locale in the current `locale`'s hierarchy.
        // The "root" locale is ignored because the built-in `Intl` libraries in
        // JavaScript have no notion of a "root" locale; instead they use the
        // IANA Language Subtag Registry.
        while (locale && locale !== 'root') {
            entry        = {locale: locale};
            parentLocale = getParentLocale(locale);

            if (parentLocale && parentLocale !== 'root') {
                entry.parentLocale = parentLocale;
            }

            locales[locale] = entry;

            locale = parentLocale;
        }

        return locales;
    }, {});
};
