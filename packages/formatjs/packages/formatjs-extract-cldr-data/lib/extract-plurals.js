/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

var makePlural = require('make-plural');
var path       = require('path');
var UglifyJS   = require('uglify-js');

var CLDR_PATH = path.resolve(__dirname, '..', 'data');

module.exports = function extractPluralRules(locales) {
    // Force make-plural to use our CLDR data.
    makePlural.load(
        path.join(CLDR_PATH, 'supplemental', 'plurals'),
        path.join(CLDR_PATH, 'supplemental', 'ordinals')
    );

    // When a `locales` collection is not specified, all of the locales that the
    // make-plural lib has are used.
    if (!locales) {
        locales = Object.keys(makePlural.rules.cardinal);
    }

    return locales.reduce(function (pluralRules, locale) {
        // Collects `pluralRuleFunction`s for each `locale` that's both
        // specified in `locales` and that make-plural has data for.
        if (makePlural.rules.cardinal[locale]) {
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
