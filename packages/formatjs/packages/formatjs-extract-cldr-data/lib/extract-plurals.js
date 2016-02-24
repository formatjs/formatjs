/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

var makePlural = require('make-plural');
var UglifyJS   = require('uglify-js');

var getParentLocale = require('./locales').getParentLocale;
var hasPluralRule   = require('./locales').hasPluralRule;
var normalizeLocale = require('./locales').normalizeLocale;

module.exports = function extractPluralRules(locales) {
    // Force make-plural to use our CLDR data.
    makePlural.load(
        require('cldr-core/supplemental/plurals.json'),
        require('cldr-core/supplemental/ordinals.json')
    );

    // The CLDR states that the "root" locale's data should be used to fill in
    // any missing data as its data is the default.
    var defaultPluralFn = makePlural('root', {ordinals: true});

    return locales.reduce(function (pluralRules, locale) {
        locale = normalizeLocale(locale);

        // The "root" locale is ignored because the built-in `Intl` libraries in
        // JavaScript have no notion of a "root" locale; instead they use the
        // IANA Language Subtag Registry.
        if (locale === 'root') {
            return pluralRules;
        }

        // Traverse the locale hierarchy until we have a locale with a plural
        // rule function, or that locale's parent is the "root". We want to stop
        // looking when we hit the root locale, because we want to assign the
        // root's function as the `locale`'s function.
        var parentLocale = getParentLocale(locale);
        while (!(hasPluralRule(locale) || parentLocale === 'root')) {
            locale       = parentLocale;
            parentLocale = getParentLocale(locale);
        }

        // Building the plural rule functions is expensive, so we avoid doing
        // extra work when we've already done it for the given `locale`.
        if (!pluralRules[locale]) {
            // We try to use the `locale`'s plural rule function if it has one,
            // otherwise we fallback to the root's.
            var fn = hasPluralRule(locale) ?
                    makePlural(locale, {ordinals: true}) : defaultPluralFn;

            // The make-plural lib returns a function with a `toString()` method
            // that is then minified. The function is serialized, minified, then
            // unserialized using `eval()`.
            eval(
                UglifyJS.minify('fn = ' + fn, {
                    fromString: true,
                    compress  : false,
                    mangle    : false,
                }).code
            );

            pluralRules[locale] = {
                pluralRuleFunction: fn,
            };
        }

        return pluralRules;
    }, {});
};
