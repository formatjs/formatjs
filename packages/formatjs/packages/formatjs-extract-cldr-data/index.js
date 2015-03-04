/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

var assign = require('object.assign');

var expandLocales         = require('./lib/expand-locales');
var extractPluralRules    = require('./lib/extract-plurals');
var extractRelativeFields = require('./lib/extract-relative');
var getAllLocales         = require('./lib/locales').getAllLocales;

module.exports = function extractData(options) {
    options = assign({
        locales       : null,
        pluralRules   : false,
        relativeFields: false,
    }, options);

    // Default to all CLDR locales if none have been provided.
    var locales = options.locales || getAllLocales();

    // Each type of data has the structure: `{"<locale>": {"<key>": <value>}}`,
    // which is well suited for merging into a single object per locale. This
    // performs that deep merge and returns the aggregated result.
    return mergeData(
        expandLocales(locales),
        options.pluralRules && extractPluralRules(locales),
        options.relativeFields && extractRelativeFields(locales)
    );
};

function mergeData(/*...sources*/) {
    var sources = [].slice.call(arguments);
    return sources.reduce(function (data, source) {
        Object.keys(source || {}).forEach(function (locale) {
            data[locale] = assign(data[locale] || {}, source[locale]);
        });

        return data;
    }, {});
}
