/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

var glob = require('glob');
var path = require('path');

var CLDR_PATH = path.resolve(__dirname, '..', 'data');

function Locales(locales) {
    this._hash = locales.reduce(function (hash, locale) {
        hash[locale.toLowerCase()] = locale;
        return hash;
    }, {});

    this._locales = locales;
}

Locales.prototype.has = function (locale) {
    return !!this.normalize(locale);
};

Locales.prototype.normalize = function (locale) {
    return this._hash[(locale || '').toLowerCase()];
};

Locales.prototype.toArray = function () {
    return this._locales.concat();
};

var localesWithPlurals = new Locales(
    Object.keys(require(path.join(CLDR_PATH, 'supplemental', 'plurals.json'))
        .supplemental['plurals-type-cardinal'])
);

var localesWithDateFields = new Locales(
    glob.sync('*/dateFields.json', {
        cwd: path.join(CLDR_PATH, 'main')
    }).map(function (filename) {
        return path.dirname(filename);
    })
);

// Create a combined collection of locales for which there's data available.
var locales = new Locales(
    localesWithPlurals.toArray()
    .concat(localesWithDateFields.toArray())
    .reduce(function (locales, locale) {
        if (locales.indexOf(locale) < 0) {
            locales.push(locale);
        }

        return locales;
    }, [])
    .sort()
);

exports.locales               = locales;
exports.localesWithPlurals    = localesWithPlurals;
exports.localesWithDateFields = localesWithDateFields;
