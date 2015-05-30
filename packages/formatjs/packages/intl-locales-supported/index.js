/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

module.exports = areIntlLocalesSupported;

function areIntlLocalesSupported(locales) {
    if (typeof Intl === 'undefined') {
        return false;
    }

    if (!locales) {
        throw new Error('locales must be supplied.');
    }

    if (!Array.isArray(locales)) {
        locales = [locales];
    }

    var intlConstructors = [
        Intl.Collator,
        Intl.DateTimeFormat,
        Intl.NumberFormat
    ].filter(function (intlConstructor) {
        return intlConstructor;
    });

    if (intlConstructors.length === 0) {
        return false;
    }

    return intlConstructors.every(function (intlConstructor) {
        var supportedLocales = intlConstructor.supportedLocalesOf(locales);
        return supportedLocales.length === locales.length;
    });
}
