/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';

export function addLocaleData(data = []) {
    let locales = Array.isArray(data) ? data : [data];

    locales.forEach((localeData) => {
        IntlMessageFormat.__addLocaleData(localeData);
        IntlRelativeFormat.__addLocaleData(localeData);
    });
}

export function hasLocaleData(locale) {
    let normalizedLocale = locale && locale.toLowerCase();

    return !!(
        IntlMessageFormat.__localeData__[normalizedLocale] &&
        IntlRelativeFormat.__localeData__[normalizedLocale]
    );
}
