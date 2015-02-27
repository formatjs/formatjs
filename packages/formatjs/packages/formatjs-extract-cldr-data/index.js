/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

var assign = require('object.assign');

var extractPluralRules = require('./lib/extract-plurals');

module.exports = function extractData(options) {
    options = assign({
        pluralRules: false,
    }, options);

    return mergeData(
        options.pluralRules && extractPluralRules()
    );
};

function mergeData(/*...sources*/) {
    var sources = [].slice.call(arguments);
    return sources.reduce(function (data, source) {
        Object.keys(source || {}).forEach(function (locale) {
            data[locale] = assign({
                locale: locale,
            }, data[locale], source[locale]);
        });

        return data;
    }, {});
}
