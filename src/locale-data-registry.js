/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';

const registeredLocales = Object.create(null);

export function addLocaleData(data = []) {
    let locales = Array.isArray(data) ? data : [data];

    locales.forEach((localeData) => {
        IntlMessageFormat.__addLocaleData(localeData);
        IntlRelativeFormat.__addLocaleData(localeData);

        let {locale} = localeData;
        registeredLocales[locale.toLowerCase()] = locale;
    });
}

export function hasLocaleData(locale) {
    locale = locale && locale.toLowerCase();
    return !!registeredLocales[locale] || !!(IntlMessageFormat.__localeData__[locale] && IntlRelativeFormat.__localeData__[locale]);
}
