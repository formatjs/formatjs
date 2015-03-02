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

module.exports = function extractData(options) {
    options = assign({
        locales       : undefined,
        pluralRules   : false,
        relativeFields: false,
    }, options);

    // The specified `locales` need to be expanded because the CLDR data is
    // hierarchical; e.g.:
    //
    // ['zh-Hant-TW'] --> ['zh-Hant-TW', 'zh-Hant', 'zh']
    var locales = options.locales && expandLocales(options.locales);

    // Each type of data has the structure: `{"<locale>": {"<field>": <data>}}`,
    // which is well suited for merging into a single object per locale. This
    // performs that deep merge and returns the aggregated result.
    return mergeData(
        options.pluralRules && extractPluralRules(locales),
        options.relativeFields && extractRelativeFields(locales)
    );
};

function mergeData(/*...sources*/) {
    var sources = [].slice.call(arguments);
    return sources.reduce(function (data, source) {
        Object.keys(source || {}).forEach(function (locale) {
            data[locale] || (data[locale] = {locale: locale});
            assign(data[locale], source[locale]);
        });

        return data;
    }, {});
}
