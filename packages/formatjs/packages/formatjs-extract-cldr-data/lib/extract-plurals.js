/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

var makePlural = require('make-plural');
var path       = require('path');
var UglifyJS   = require('uglify-js');

var availableLocales = require('./locales').localesWithPlurals;

var CLDR_PATH = path.resolve(__dirname, '..', 'data');

module.exports = function extractPluralRules(locales) {
    // Force make-plural to use our CLDR data.
    makePlural.load(
        path.join(CLDR_PATH, 'supplemental', 'plurals'),
        path.join(CLDR_PATH, 'supplemental', 'ordinals')
    );

    return locales.reduce(function (pluralRules, locale) {
        locale = availableLocales.normalize(locale);

        // Collects `pluralRuleFunction`s for each `locale` that's both
        // specified in `locales` and that the CLDR has data for.
        if (availableLocales.has(locale)) {
            // The make-plural lib returns a function with a `toString()` method
            // that is then minified. The function is serialized, minified, then
            // unserialized using `eval()`.
            var fn = makePlural(locale, {ordinals: true});
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
