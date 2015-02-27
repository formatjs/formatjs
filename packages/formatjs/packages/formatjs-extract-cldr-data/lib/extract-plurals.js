/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

var makePlural = require('make-plural');

module.exports = function extractPluralRules() {
    // Force make-plural to load its data.
    makePlural('en');

    var locales = Object.keys(makePlural.rules.cardinal);
    return locales.reduce(function (pluralRules, locale) {
        pluralRules[locale] = {
            pluralRuleFunction: makePlural(locale, {ordinals: true}).toString()
        };

        return pluralRules;
    }, {});
};
